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
    if (!booking_id) throw new Error("booking_id is required");

    // 1. جلب تفاصيل الحجز الكاملة
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select(`
        *,
        hotels ( name_en, name_ar, contact_email ),
        room_categories ( name_en, name_ar )
      `)
      .eq("id", booking_id)
      .single();

    if (bookingErr || !booking) throw new Error("Booking not found");

    // 2. جلب إعدادات API الفندق
    const { data: syncSetting } = await supabase
      .from("local_sync_settings")
      .select("api_endpoint, secret_key, is_active")
      .eq("hotel_id", booking.hotel_id)
      .single();

    if (!syncSetting?.api_endpoint || !syncSetting.is_active) {
      console.log("Hotel has no active API endpoint — skipping hotel notification");
      return new Response(
        JSON.stringify({ sent: false, reason: "No active API endpoint" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. تحضير البيانات
    const nights = Math.ceil(
      (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime())
      / 86400000
    );
    const peak = isPeakSeason(booking.check_in);
    const balance = booking.total_price - booking.deposit_amount;
    const roomName = booking.room_categories?.name_en
      ?? booking.room_categories?.name_ar
      ?? "Room";

    // 4. إرسال للفندق
    const payload = {
      booking_reference: booking.transaction_hash,
      room_number: booking.room_number ?? null,
      room_category: roomName,
      check_in: booking.check_in,
      check_out: booking.check_out,
      nights,

      guest: {
        first_name: booking.guest_first_name,
        last_name: booking.guest_last_name,
        email: booking.guest_email,
        phone: booking.guest_phone ?? null,
        nationality: booking.nationality ?? null,
        guests_count: booking.guests_count ?? 1,
      },

      pricing: {
        price_per_night: booking.total_price / nights,
        total_amount: booking.total_price,
        deposit_paid: booking.deposit_amount,
        balance_due_cash: balance,
        currency: "USD",
      },

      refund_policy: {
        is_peak_season: peak,
        deposit_refundable: !peak,
        policy_note_ar: peak
          ? "الموسم الصيفي (15 يونيو – 15 سبتمبر): العربون 10% غير قابل للاسترداد"
          : "خارج الموسم: يُسترد العربون كاملاً عند الإلغاء قبل 48 ساعة",
        policy_note_en: peak
          ? "Peak season (Jun 15–Sep 15): The 10% deposit is non-refundable"
          : "Off-peak: Full deposit refund if cancelled 48h+ before check-in",
      },

      special_requests: booking.special_requests ?? null,
      booking_timestamp: booking.created_at,
    };

    const hotelRes = await fetch(`${syncSetting.api_endpoint}/booking-confirmed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${syncSetting.secret_key}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    const hotelData = hotelRes.ok ? await hotelRes.json() : null;

    // 5. تحديث booking بحالة الإرسال
    await supabase.from("bookings").update({
      hotel_notification_status: hotelRes.ok ? "sent" : "failed",
      hotel_notified_at: new Date().toISOString(),
      hotel_booking_id: hotelData?.hotel_booking_id ?? null,
    }).eq("id", booking_id);

    // 6. تسجيل في webhook_logs
    await supabase.from("webhook_logs").insert({
      hotel_id: booking.hotel_id,
      event_type: "booking_sent_to_hotel",
      payload: { booking_reference: booking.transaction_hash, status: hotelRes.status },
      status: hotelRes.ok ? "sent" : "failed",
    });

    return new Response(
      JSON.stringify({ sent: hotelRes.ok, hotel_booking_id: hotelData?.hotel_booking_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("send-booking-to-hotel error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
