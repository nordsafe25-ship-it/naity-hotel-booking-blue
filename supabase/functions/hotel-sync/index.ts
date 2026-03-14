import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. التحقق من الـ secret key
    const authHeader = req.headers.get("authorization") ?? "";
    const secretKey = authHeader.replace("Bearer ", "").trim();

    if (!secretKey) {
      return new Response(JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. إيجاد الفندق عبر secret_key
    const { data: syncSetting } = await supabase
      .from("local_sync_settings")
      .select("hotel_id, is_active")
      .eq("secret_key", secretKey)
      .single();

    if (!syncSetting || !syncSetting.is_active) {
      return new Response(JSON.stringify({ error: "Invalid or inactive API key" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const hotelId = syncSetting.hotel_id;
    const body = await req.json();
    const rooms = body.rooms ?? [];

    if (!Array.isArray(rooms) || rooms.length === 0) {
      return new Response(JSON.stringify({ error: "rooms array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. تحديث حالة كل غرفة (upsert)
    const now = new Date().toISOString();
    let updatedCount = 0;

    for (const room of rooms) {
      const { error } = await supabase
        .from("room_availability")
        .upsert({
          hotel_id: hotelId,
          room_number: String(room.room_number),
          category_name: room.category ?? null,
          status: room.status ?? "available",
          price_per_night: room.price_per_night ?? null,
          occupied_check_in: room.check_in ?? null,
          occupied_check_out: room.check_out ?? null,
          sham_soft_room_id: room.sham_soft_room_id ?? null,
          room_kind: room.room_kind ?? null,
          last_updated_by_hotel: now,
          updated_at: now,
        }, {
          onConflict: "hotel_id,room_number",
        });

      if (!error) updatedCount++;
    }

    // 4. تحديث last_sync_at في local_sync_settings
    await supabase
      .from("local_sync_settings")
      .update({ last_sync_at: now })
      .eq("hotel_id", hotelId);

    // 5. Log in webhook_logs + sync_history
    await Promise.all([
      supabase.from("webhook_logs").insert({
        hotel_id: hotelId,
        event_type: "rooms_sync",
        payload: { rooms_received: rooms.length, rooms_updated: updatedCount },
        status: "processed",
      }),
      supabase.from("sync_history").insert({
        hotel_id: hotelId,
        event_type: "inventory_sync",
        direction: "inbound",
        records_count: updatedCount,
        status: "success",
        metadata: { rooms_received: rooms.length },
      }),
    ]);

    return new Response(
      JSON.stringify({
        received: true,
        updated_rooms: updatedCount,
        timestamp: now,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("hotel-sync error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
