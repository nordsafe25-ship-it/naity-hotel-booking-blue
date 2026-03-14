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
    // Authenticate via X-Hotel-API-Key header
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

    // GET: Fetch pending reservations for this hotel
    if (req.method === "GET") {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          id, transaction_hash, room_number, room_category_id,
          guest_first_name, guest_last_name, guest_email, guest_phone,
          nationality, guests_count,
          check_in, check_out, total_price, deposit_amount,
          special_requests, status, payment_status, sync_status, created_at,
          room_categories ( name_en, name_ar )
        `)
        .eq("hotel_id", hotelId)
        .eq("sync_status", "pending")
        .in("status", ["confirmed", "active", "checked_in"])
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Log this fetch
      await supabase.from("sync_history").insert({
        hotel_id: hotelId,
        event_type: "reservations_fetch",
        direction: "outbound",
        records_count: bookings?.length ?? 0,
        status: "success",
      });

      return new Response(
        JSON.stringify({ reservations: bookings ?? [], count: bookings?.length ?? 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("hotel-reservations error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
