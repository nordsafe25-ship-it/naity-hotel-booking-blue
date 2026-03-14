import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hotel-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = req.headers.get("x-hotel-api-key") ?? req.headers.get("authorization")?.replace("Bearer ", "").trim() ?? "";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: syncSetting } = await supabase
      .from("local_sync_settings")
      .select("hotel_id, is_active")
      .eq("secret_key", apiKey)
      .single();

    if (!syncSetting?.is_active) {
      return new Response(JSON.stringify({ error: "Invalid or inactive API key" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const hotelId = syncSetting.hotel_id;
    const body = await req.json();
    const { booking_ids, hotel_booking_id } = body;

    if (!Array.isArray(booking_ids) || booking_ids.length === 0) {
      return new Response(JSON.stringify({ error: "booking_ids array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update sync_status to 'synced' for confirmed bookings
    let confirmedCount = 0;
    for (const bookingId of booking_ids) {
      const { error } = await supabase
        .from("bookings")
        .update({
          sync_status: "synced",
          hotel_booking_id: hotel_booking_id ?? null,
        })
        .eq("id", bookingId)
        .eq("hotel_id", hotelId); // Ensure hotel can only update its own bookings

      if (!error) confirmedCount++;
    }

    // Log sync confirmation
    await supabase.from("sync_history").insert({
      hotel_id: hotelId,
      event_type: "reservation_sync_confirm",
      direction: "inbound",
      records_count: confirmedCount,
      status: "success",
      metadata: { booking_ids, hotel_booking_id },
    });

    // Update heartbeat
    await supabase.from("local_sync_settings")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("hotel_id", hotelId);

    return new Response(
      JSON.stringify({ confirmed: confirmedCount, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("hotel-sync-confirm error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
