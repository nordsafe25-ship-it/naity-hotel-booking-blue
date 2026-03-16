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

  // Authenticate via X-API-KEY
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
    // GET → return rooms for this company's hotels
    if (req.method === "GET") {
      const { data: hotels } = await supabase
        .from("hotels")
        .select("id, name_en, name_ar, external_hotel_id")
        .eq("company_id", company.id);

      if (!hotels || hotels.length === 0) {
        return json({ status: "success", hotels: [], rooms: [] });
      }

      const hotelIds = hotels.map((h: any) => h.id);
      const { data: rooms } = await supabase
        .from("room_categories")
        .select("*")
        .in("hotel_id", hotelIds);

      return json({ status: "success", hotels, rooms: rooms || [] });
    }

    // POST → upsert room data
    if (req.method === "POST") {
      const body = await req.json();
      const { HotelId, RoomId, Price, Bed, Status, YesToDate } = body;

      if (HotelId === undefined || RoomId === undefined) {
        return json({ status: "error", message: "HotelId and RoomId are required" }, 400);
      }

      // Find hotel by external_hotel_id + company_id
      const { data: hotel } = await supabase
        .from("hotels")
        .select("id")
        .eq("external_hotel_id", HotelId)
        .eq("company_id", company.id)
        .maybeSingle();

      if (!hotel) {
        await supabase.from("api_sync_logs").insert({
          company_id: company.id,
          event_type: "error",
          payload: body,
          status: "failed",
        });
        return json({ status: "error", message: "Hotel not found" }, 404);
      }

      const roomName = `Room ${RoomId}`;
      const isActive = Status === "Available";

      // Check if room exists by hotel_id + name_en
      const { data: existingRoom } = await supabase
        .from("room_categories")
        .select("id")
        .eq("hotel_id", hotel.id)
        .eq("name_en", roomName)
        .maybeSingle();

      if (existingRoom) {
        // Update existing room
        await supabase
          .from("room_categories")
          .update({
            price_per_night: Price,
            is_active: isActive,
            max_guests: Bed || 2,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRoom.id);
      } else {
        // Insert new room category
        await supabase.from("room_categories").insert({
          hotel_id: hotel.id,
          name_en: roomName,
          name_ar: `غرفة ${RoomId}`,
          description_en: `Synced from ${company.name}`,
          description_ar: `مزامنة من ${company.name}`,
          price_per_night: Price,
          max_guests: Bed || 2,
          is_active: isActive,
          total_rooms: 1,
        });
      }

      // Update last_sync_at
      await supabase
        .from("api_companies")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", company.id);

      // Log sync
      await supabase.from("api_sync_logs").insert({
        company_id: company.id,
        hotel_id: hotel.id,
        event_type: "room_sync",
        payload: body,
        status: "success",
      });

      return json({ status: "success", message: "Room synced" });
    }

    return json({ status: "error", message: "Method not allowed" }, 405);
  } catch (err) {
    // Log error
    try {
      await supabase.from("api_sync_logs").insert({
        company_id: company.id,
        event_type: "error",
        payload: { error: String(err) },
        status: "failed",
      });
    } catch (_) { /* ignore logging errors */ }

    return json({ status: "error", message: String(err) }, 500);
  }
});
