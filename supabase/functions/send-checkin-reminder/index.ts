import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(to: string, subject: string, html: string) {
  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get("SMTP_HOST") ?? "naity.net",
      port: Number(Deno.env.get("SMTP_PORT") ?? "465"),
      tls: true,
      auth: {
        username: Deno.env.get("SMTP_USER") ?? "no-replay@naity.net",
        password: Deno.env.get("SMTP_PASS") ?? "",
      },
    },
  });
  try {
    await client.send({
      from: "Naity Bookings <no-replay@naity.net>",
      to,
      subject,
      content: "auto",
      html,
    });
  } finally {
    await client.close();
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const APP_URL = Deno.env.get("APP_URL") ?? "https://naity.net";

    const now = new Date();
    const from48h = new Date(now.getTime() + 47 * 3600000).toISOString().split('T')[0];
    const to48h   = new Date(now.getTime() + 49 * 3600000).toISOString().split('T')[0];

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        *,
        hotels(name_ar, name_en, city, address, contact_email, contact_phone,
               check_in_time, check_out_time, property_type, stars)
      `)
      .in("status", ["confirmed", "active"])
      .gte("check_in", from48h)
      .lte("check_in", to48h);

    if (error) throw error;
    if (!bookings?.length) return json({ sent: 0, message: "No reminders needed" });

    let sent = 0;

    for (const booking of bookings) {
      const hotel = booking.hotels as any;
      const hotelName = hotel?.name_ar ?? hotel?.name_en ?? "Hotel";
      const hotelNameEn = hotel?.name_en ?? hotel?.name_ar ?? "Hotel";
      const checkInDate = new Date(booking.check_in).toLocaleDateString("en-GB");
      const checkOutDate = new Date(booking.check_out).toLocaleDateString("en-GB");
      const nights = Math.ceil(
        (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000
      );
      const balance = booking.total_price - (booking.deposit_amount ?? 0);
      const checkInTime = hotel?.check_in_time ?? "14:00";

      const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Reminder</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:28px;letter-spacing:2px;">Naity</h1>
    <p style="color:#a0a0b0;margin:6px 0 0;font-size:13px;">We Prepare Your Stay</p>
  </td></tr>
  <tr><td style="padding:32px 24px 16px;text-align:center;">
    <p style="font-size:52px;margin:0;">⏰</p>
    <h2 style="color:#1a1a2e;margin:16px 0 4px;font-size:22px;">تذكير — إقامتك بعد 48 ساعة</h2>
    <p style="color:#555;font-size:14px;margin:0;">Reminder — Your stay in 48 hours</p>
  </td></tr>
  <tr><td style="padding:0 28px 32px;">
    <p style="color:#555;font-size:14px;margin:0 0 16px;">عزيزي ${booking.guest_first_name}، نذكّرك بإقامتك القادمة:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
      <tr><td style="background:#f0fdf4;padding:12px 16px;"><p style="margin:0;font-size:14px;font-weight:700;color:#065f46;">🏨 ${hotelName}</p></td></tr>
      <tr><td style="padding:0;">
        <table width="100%" cellpadding="10" cellspacing="0" style="font-size:13px;">
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="color:#888;">المدينة / City</td><td style="font-weight:700;color:#1a1a2e;">${hotel?.city ?? "—"}</td></tr>
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="color:#888;">تاريخ الوصول / Check-in</td><td style="font-weight:700;color:#1a1a2e;">${checkInDate}</td></tr>
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="color:#888;">وقت الاستقبال / Check-in time</td><td style="font-weight:700;color:#1a1a2e;">${checkInTime}</td></tr>
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="color:#888;">تاريخ المغادرة / Check-out</td><td style="font-weight:700;color:#1a1a2e;">${checkOutDate}</td></tr>
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="color:#888;">عدد الليالي / Nights</td><td style="font-weight:700;color:#1a1a2e;">${nights}</td></tr>
          <tr><td style="color:#888;">💵 الباقي عند الوصول</td><td style="font-weight:700;color:#1a1a2e;">$${balance}</td></tr>
        </table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr><td style="background:#fff3cd;border-radius:10px;padding:16px;">
        <p style="color:#856404;font-size:14px;margin:0;line-height:1.7;">
          ⚠️ تذكير مهم: يرجى إحضار مبلغ $${balance} نقداً لدفعه عند الاستقبال.<br/>
          Important: Please bring $${balance} cash to pay at reception.
        </p>
      </td></tr>
    </table>
    ${hotel?.contact_phone ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr><td style="background:#eff6ff;border-radius:10px;padding:16px;">
        <p style="color:#1e40af;font-size:14px;margin:0;line-height:1.7;">
          📞 تواصل مع الفندق / Hotel contact:<br/>
          ${hotel.contact_phone}${hotel.contact_email ? `<br/>${hotel.contact_email}` : ''}
        </p>
      </td></tr>
    </table>` : ''}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr><td style="text-align:center;padding:12px;">
        <p style="color:#888;font-size:12px;margin:0 0 4px;">🔑 رقم الحجز / Booking Reference</p>
        <p style="font-family:monospace;font-size:14px;color:#1a1a2e;margin:0;font-weight:700;">${booking.transaction_hash ?? booking.id.slice(0, 8)}</p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr><td style="text-align:center;">
        <a href="${APP_URL}/my-bookings" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;">📋 عرض تفاصيل حجزك</a>
      </td></tr>
    </table>
    <p style="color:#555;font-size:14px;margin:16px 0;">نتمنى لك إقامة ممتعة! · We wish you a pleasant stay!</p>
    <p style="color:#555;font-size:14px;">للمساعدة: <a href="mailto:support@naity.net" style="color:#2563eb;">support@naity.net</a></p>
  </td></tr>
  <tr><td style="background:#1a1a2e;padding:20px;text-align:center;">
    <p style="color:#a0a0b0;font-size:12px;margin:0;">© 2025 Naity — naity.net</p>
  </td></tr>
</table>
</body>
</html>`;

      try {
        await sendEmail(
          booking.guest_email,
          `⏰ تذكير إقامتك في ${hotelName} — ${checkInDate} | Reminder: ${hotelNameEn}`,
          html
        );
        sent++;
      } catch (emailErr) {
        console.error(`Reminder failed for booking ${booking.id}:`, emailErr);
      }
    }

    return json({ sent, total: bookings.length });

  } catch (err: any) {
    console.error("Reminder error:", err);
    return json({ error: err.message }, 500);
  }
});
