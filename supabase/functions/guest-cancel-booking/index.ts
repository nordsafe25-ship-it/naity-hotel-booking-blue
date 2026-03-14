import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20", httpClient: Stripe.createFetchHttpClient(),
});
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const isPeakSeason = (dateStr: string): boolean => {
  const d = new Date(dateStr); const m = d.getMonth() + 1; const day = d.getDate();
  if (m === 6 && day >= 15) return true;
  if (m === 7 || m === 8) return true;
  if (m === 9 && day <= 15) return true;
  return false;
};

const getRefundAmount = (depositAmount: number, checkIn: string, peak: boolean) => {
  if (peak) return { refundAmount: 0, refundPercent: 0,
    policyAr: "موسم الذروة: لا يوجد استرداد للعربون.",
    policyEn: "Peak season: No deposit refund." };
  const h = (new Date(checkIn).getTime() - Date.now()) / 3600000;
  if (h >= 48) return { refundAmount: depositAmount, refundPercent: 100,
    policyAr: "استرداد كامل للعربون.", policyEn: "Full deposit refund." };
  if (h >= 24) return { refundAmount: Math.round(depositAmount * 0.5), refundPercent: 50,
    policyAr: "استرداد 50% من العربون.", policyEn: "50% deposit refund." };
  return { refundAmount: 0, refundPercent: 0,
    policyAr: "لا يوجد استرداد (أقل من 24 ساعة).", policyEn: "No refund (less than 24 hours)." };
};

async function sendEmail(to: string, subject: string, html: string) {
  const client = new SMTPClient({ connection: {
    hostname: Deno.env.get("SMTP_HOST") ?? "naity.net",
    port: Number(Deno.env.get("SMTP_PORT") ?? "465"), tls: true,
    auth: { username: Deno.env.get("SMTP_USER") ?? "", password: Deno.env.get("SMTP_PASS") ?? "" },
  }});
  await client.send({ from: "Naity Bookings <no-replay@naity.net>", to, subject, content: "auto", html });
  await client.close();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { booking_id, guest_email } = await req.json();
    if (!booking_id || !guest_email) return new Response(
      JSON.stringify({ error: "booking_id and guest_email are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("*, hotels(name_ar, name_en, contact_email, property_type), room_categories(name_ar, name_en)")
      .eq("id", booking_id)
      .eq("guest_email", guest_email)
      .single();

    if (fetchErr || !booking) return new Response(
      JSON.stringify({ error: "Booking not found or email mismatch" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (["cancelled", "completed", "checked_in"].includes(booking.status)) return new Response(
      JSON.stringify({ error: "Booking cannot be cancelled" }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const peak = isPeakSeason(booking.check_in);
    const depositAmount = Number(booking.deposit_amount ?? 0);
    const { refundAmount, refundPercent, policyAr, policyEn } = getRefundAmount(depositAmount, booking.check_in, peak);

    // Stripe refund
    let stripeRefundId: string | null = null;
    let actualRefunded = 0;
    if (refundAmount > 0 && booking.stripe_payment_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(booking.stripe_payment_id);
        const piId = session.payment_intent as string;
        if (piId) {
          const refund = await stripe.refunds.create({
            payment_intent: piId,
            amount: Math.round(refundAmount * 100),
            reason: "requested_by_customer",
            metadata: { booking_id: booking.id, guest_email, refund_percent: String(refundPercent) },
          });
          stripeRefundId = refund.id;
          actualRefunded = refundAmount;
        }
      } catch (e) { console.error("Stripe refund failed:", e); }
    }

    // Update status
    await supabase.from("bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", booking_id);

    // Unblock apartment dates
    if ((booking.hotels as any)?.property_type === "apartment") {
      await supabase.from("blocked_dates").delete()
        .eq("hotel_id", booking.hotel_id)
        .gte("blocked_date", booking.check_in)
        .lt("blocked_date", booking.check_out);
    }

    // Notify hotel system
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-cancellation-to-hotel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
        body: JSON.stringify({ booking_id }),
      });
    } catch (e) { console.error("Hotel notify failed:", e); }

    // Cancellation email
    const hotelName = (booking.hotels as any)?.name_en ?? "Hotel";
    const checkInFmt = new Date(booking.check_in).toLocaleDateString("en-GB");
    const checkOutFmt = new Date(booking.check_out).toLocaleDateString("en-GB");

    const emailHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Booking Cancelled</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:28px;letter-spacing:2px;">Naity</h1>
    <p style="color:#a0a0b0;margin:6px 0 0;font-size:13px;">We Prepare Your Stay</p>
  </td></tr>
  <tr><td style="padding:32px 24px 16px;text-align:center;">
    <p style="font-size:52px;margin:0;">❌</p>
    <h2 style="color:#1a1a2e;margin:16px 0 4px;font-size:22px;">تم إلغاء حجزك | Booking Cancelled</h2>
  </td></tr>
  <tr><td style="padding:0 28px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
      <tr><td style="background:#fef2f2;padding:12px 16px;"><p style="margin:0;font-size:14px;font-weight:700;color:#991b1b;">📋 Cancelled Booking Details</p></td></tr>
      <tr><td style="padding:0;">
        <table width="100%" cellpadding="10" cellspacing="0" style="font-size:13px;">
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="color:#888;">Hotel</td><td style="font-weight:700;color:#1a1a2e;">${hotelName}</td></tr>
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="color:#888;">Check-in</td><td style="font-weight:700;color:#1a1a2e;">${checkInFmt}</td></tr>
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="color:#888;">Check-out</td><td style="font-weight:700;color:#1a1a2e;">${checkOutFmt}</td></tr>
          <tr><td style="color:#888;">Deposit Paid</td><td style="font-weight:700;color:#1a1a2e;">$${depositAmount}</td></tr>
        </table>
      </td></tr>
    </table>
    ${refundAmount > 0
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
          <tr><td style="background:#ecfdf5;border-radius:10px;padding:16px;">
            <p style="color:#065f46;font-size:14px;margin:0;line-height:1.7;">
              ✅ سيتم استرداد $${refundAmount} خلال 5-10 أيام عمل<br/>
              ✅ Refund of $${refundAmount} in 5-10 business days<br/>
              ${policyEn}
            </p>
          </td></tr>
        </table>`
      : `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
          <tr><td style="background:#fff3cd;border-radius:10px;padding:16px;">
            <p style="color:#856404;font-size:14px;margin:0;line-height:1.7;">
              ⚠️ لا يوجد استرداد للعربون | No refund on deposit<br/>
              ${policyEn}
            </p>
          </td></tr>
        </table>`}
    <p style="color:#555;font-size:14px;margin:16px 0;">للاستفسار: <a href="mailto:support@naity.net" style="color:#2563eb;">support@naity.net</a></p>
    <p style="color:#555;font-size:14px;">فريق Naity / Naity Team</p>
  </td></tr>
  <tr><td style="background:#1a1a2e;padding:20px;text-align:center;">
    <p style="color:#a0a0b0;font-size:12px;margin:0;">© 2025 Naity — naity.net</p>
  </td></tr>
</table>
</body>
</html>`;

    try {
      await sendEmail(guest_email,
        `❌ تم إلغاء حجزك | Booking Cancelled — ${hotelName} · ${checkInFmt}`, emailHtml);
    } catch (e) { console.error("Email failed:", e); }

    return new Response(JSON.stringify({
      success: true, refunded: actualRefunded, refund_percent: refundPercent,
      stripe_refund_id: stripeRefundId, policy_ar: policyAr, policy_en: policyEn, peak_season: peak,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
