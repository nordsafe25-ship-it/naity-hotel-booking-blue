import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Authenticate via X-API-KEY header
  const apiKey = req.headers.get("x-api-key") || req.headers.get("X-API-KEY");
  if (!apiKey) {
    return json({ status: "error", message: "Missing API key" }, 401);
  }

  const { data: company, error: companyErr } = await supabase
    .from("api_companies")
    .select("*")
    .eq("api_key", apiKey)
    .eq("status", "active")
    .maybeSingle();

  if (companyErr || !company) {
    return json({ status: "error", message: "Invalid API key" }, 401);
  }

  try {
    // 2. GET — return rooms for hotels belonging to this company
    if (req.method === "GET") {
      const { data: hotels } = await supabase
        .from("hotels")
        .select("id, name_en, name_ar")
        .eq("company_id", company.id);

      if (!hotels || hotels.length === 0) {
        return json({ status: "success", hotels: [], rooms: [] });
      }

      const hotelIds = hotels.map((h: any) => h.id);

      const { data: rooms } = await supabase
        .from("room_availability")
        .select("*")
        .in("hotel_id", hotelIds);

      return json({ status: "success", hotels, rooms: rooms || [] });
    }

    // 3. POST — upsert room data
    if (req.method === "POST") {
      const body = await req.json();
      const { HotelId, RoomId, Price, Bed, Status, YesToDate } = body;

      if (!HotelId || !RoomId) {
        return json({ status: "error", message: "HotelId and RoomId are required" }, 400);
      }

      // Find hotel belonging to this company
      const { data: hotels } = await supabase
        .from("hotels")
        .select("id")
        .eq("company_id", company.id);

      if (!hotels || hotels.length === 0) {
        await supabase.from("api_sync_logs").insert({
          company_id: company.id,
          event_type: "error",
          payload: body,
          status: "failed",
        });
        return json({ status: "error", message: "No hotels linked to this company" }, 404);
      }

      // Use first hotel or match by external id pattern
      const hotel = hotels[0];

      // Map status
      const roomStatus = Status === "Booked" ? "occupied" : "available";

      // Upsert room_availability by sham_soft_room_id
      const { error: upsertErr } = await supabase
        .from("room_availability")
        .upsert(
          {
            hotel_id: hotel.id,
            room_number: String(RoomId),
            sham_soft_room_id: String(RoomId),
            price_per_night: Price || null,
            status: roomStatus,
            room_kind: Bed ? `${Bed} bed(s)` : null,
            occupied_check_out: YesToDate || null,
            last_updated_by_hotel: new Date().toISOString(),
          },
          { onConflict: "hotel_id,sham_soft_room_id", ignoreDuplicates: false }
        );

      // Log sync
      await supabase.from("api_sync_logs").insert({
        company_id: company.id,
        hotel_id: hotel.id,
        event_type: "room_sync",
        payload: body,
        status: upsertErr ? "failed" : "success",
      });

      if (upsertErr) {
        // Fallback: try insert/update without onConflict
        const { data: existing } = await supabase
          .from("room_availability")
          .select("id")
          .eq("hotel_id", hotel.id)
          .eq("sham_soft_room_id", String(RoomId))
          .maybeSingle();

        if (existing) {
          await supabase
            .from("room_availability")
            .update({
              price_per_night: Price || null,
              status: roomStatus,
              room_kind: Bed ? `${Bed} bed(s)` : null,
              occupied_check_out: YesToDate || null,
              last_updated_by_hotel: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("room_availability").insert({
            hotel_id: hotel.id,
            room_number: String(RoomId),
            sham_soft_room_id: String(RoomId),
            price_per_night: Price || null,
            status: roomStatus,
            room_kind: Bed ? `${Bed} bed(s)` : null,
            occupied_check_out: YesToDate || null,
            last_updated_by_hotel: new Date().toISOString(),
          });
        }
      }

      return json({ status: "success", message: "Room synced" });
    }

    return json({ status: "error", message: "Method not allowed" }, 405);
  } catch (err) {
    return json({ status: "error", message: String(err) }, 500);
  }
});
