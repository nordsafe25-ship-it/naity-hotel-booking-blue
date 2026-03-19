import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const isPeakSeason = (dateStr: string): boolean => {
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (m === 6 && day >= 15) return true;
  if (m === 7 || m === 8) return true;
  if (m === 9 && day <= 15) return true;
  return false;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { booking_id } = await req.json();

    const { data: booking } = await supabase
      .from("bookings")
      .select("*, hotels(*)")
      .eq("id", booking_id)
      .single();

    if (!booking) throw new Error("Booking not found");

    const isApartment = (booking.hotels as any)?.property_type === "apartment";

    // Unblock dates for apartments on cancellation
    if (isApartment) {
      await supabase
        .from("blocked_dates")
        .delete()
        .eq("hotel_id", booking.hotel_id)
        .gte("blocked_date", booking.check_in)
        .lt("blocked_date", booking.check_out);
    }

    const { data: syncSetting } = await supabase
      .from("local_sync_settings")
      .select("api_endpoint, secret_key, is_active")
      .eq("hotel_id", booking.hotel_id)
      .single();

    if (!syncSetting?.api_endpoint || !syncSetting.is_active) {
      return new Response(
        JSON.stringify({ sent: false, reason: "No active API" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const peak = isPeakSeason(booking.check_in);
    const depositAmount = Number(booking.deposit_amount ?? 0);

    // Calculate refund based on property type
    let refundAmount = 0;
    let depositRefunded = false;
    let reason = "";

    if (peak) {
      reason = "Peak season cancellation — no refund policy applied";
    } else if (isApartment) {
      const h = (new Date(booking.check_in).getTime() - Date.now()) / 3600000;
      if (h >= 72) {
        refundAmount = depositAmount; depositRefunded = true;
        reason = "Apartment off-peak cancellation 72h+ — full deposit refunded";
      } else if (h >= 48) {
        refundAmount = Math.round(depositAmount * 0.5); depositRefunded = true;
        reason = "Apartment off-peak cancellation 48-72h — 50% deposit refunded";
      } else {
        reason = "Apartment cancellation <48h — no refund";
      }
    } else {
      const h = (new Date(booking.check_in).getTime() - Date.now()) / 3600000;
      if (h >= 48) {
        refundAmount = depositAmount; depositRefunded = true;
        reason = "Hotel off-peak cancellation 48h+ — full deposit refunded";
      } else if (h >= 24) {
        refundAmount = Math.round(depositAmount * 0.5); depositRefunded = true;
        reason = "Hotel off-peak cancellation 24-48h — 50% deposit refunded";
      } else {
        reason = "Hotel cancellation <24h — no refund";
      }
    }

    const payload = {
      booking_reference: booking.transaction_hash,
      room_number: booking.room_number ?? null,
      check_in: booking.check_in,
      check_out: booking.check_out,
      cancelled_at: new Date().toISOString(),
      guest: {
        first_name: booking.guest_first_name,
        last_name: booking.guest_last_name,
        email: booking.guest_email,
        phone: booking.guest_phone ?? null,
      },
      refund: {
        is_peak_season: peak,
        is_apartment: isApartment,
        deposit_refunded: depositRefunded,
        amount_refunded: refundAmount,
        reason,
      },
    };

    const hotelRes = await fetch(`${syncSetting.api_endpoint}/booking-cancelled`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${syncSetting.secret_key}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    await supabase.from("webhook_logs").insert({
      hotel_id: booking.hotel_id,
      event_type: "cancellation_sent_to_hotel",
      payload: { booking_reference: booking.transaction_hash, refunded: depositRefunded, is_apartment: isApartment },
      status: hotelRes.ok ? "sent" : "failed",
    });

    return new Response(
      JSON.stringify({ sent: hotelRes.ok }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("send-cancellation-to-hotel error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
