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
    // 1. Expire completed bookings (check_out < today)
    const { error: expireErr } = await supabase.rpc("expire_completed_bookings");
    if (expireErr) console.error("expire_completed_bookings error:", expireErr);

    // 2. Unlist stale rooms (last_updated_by_hotel > 24h)
    const { error: unlistErr } = await supabase.rpc("unlist_stale_rooms");
    if (unlistErr) console.error("unlist_stale_rooms error:", unlistErr);

    return new Response(
      JSON.stringify({
        ok: true,
        ran: ["expire_completed_bookings", "unlist_stale_rooms"],
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("scheduled-cleanup error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
