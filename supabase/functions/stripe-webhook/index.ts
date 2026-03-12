import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function sendEmail(to: string, subject: string, html: string) {
  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get("SMTP_HOST") ?? "naity.net",
      port: Number(Deno.env.get("SMTP_PORT") ?? "465"),
      tls: true,
      auth: {
        username: Deno.env.get("SMTP_USER") ?? "",
        password: Deno.env.get("SMTP_PASS") ?? "",
      },
    },
  });

  await client.send({
    from: "Naity Bookings <no-replay@naity.net>",
    to,
    subject,
    content: "auto",
    html,
  });

  await client.close();
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature") ?? "";
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  await supabase.from("webhook_logs").insert({
    hotel_id: session.metadata?.hotel_id ?? "00000000-0000-0000-0000-000000000000",
    event_type: event.type,
    payload: { session_id: session.id, metadata: session.metadata },
    status: "received",
  });

  if (event.type === "checkout.session.completed") {
    const bookingId = session.metadata?.booking_id;
    const txHash = session.metadata?.transaction_hash;
    const guestEmail = session.metadata?.guest_email;
    const guestName = session.metadata?.guest_name;

    if (!bookingId) return new Response("No booking_id", { status: 400 });

    const { data: booking } = await supabase
      .from("bookings")
      .update({
        payment_status: "deposit_paid",
        status: "confirmed",
        stripe_payment_id: session.id,
      })
      .eq("id", bookingId)
      .select("*, hotels(name_ar,name_en,city,address,contact_email), room_categories(name_ar,name_en)")
      .single();

    if (!booking) return new Response("Booking not found", { status: 404 });

    const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000);
    const hotelName = booking.hotels?.name_en ?? booking.hotels?.name_ar ?? "Hotel";
    const roomName = booking.room_categories?.name_en ?? booking.room_categories?.name_ar ?? "Room";
    const checkInFmt = new Date(booking.check_in).toLocaleDateString("en-GB");
    const checkOutFmt = new Date(booking.check_out).toLocaleDateString("en-GB");
    const balance = booking.total_price - booking.deposit_amount;
    const APP_URL = Deno.env.get("APP_URL") ?? "https://naity.com";

    // Guest confirmation email (bilingual AR/EN)
    const guestEmailHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Naity Booking Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 24px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:28px;letter-spacing:2px;">Naity</h1>
        <p style="color:#a0a0b0;margin:6px 0 0;font-size:13px;">We Prepare Your Stay</p>
      </td>
    </tr>
    <!-- Icon + Titles -->
    <tr>
      <td style="padding:32px 24px 16px;text-align:center;">
        <p style="font-size:52px;margin:0;">✅</p>
        <h2 style="color:#1a1a2e;margin:16px 0 4px;font-size:22px;font-weight:700;">تم تأكيد حجزك بنجاح!</h2>
        <h3 style="color:#444;margin:0;font-size:16px;font-weight:600;">Booking Confirmed Successfully!</h3>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:0 28px 32px;">

        <!-- ===== ARABIC SECTION ===== -->
        <p style="color:#333;font-size:15px;line-height:1.8;direction:rtl;text-align:right;">
          عزيزي ${guestName}،
        </p>
        <p style="color:#555;font-size:14px;line-height:1.8;direction:rtl;text-align:right;">
          نشكر لك استخدامك تطبيق Naity لحجز إقامتك.
          يسعدنا تأكيد تفاصيل الحجز الخاص بك كما يلي:
        </p>

        <!-- AR Booking Details Table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:#f0f4ff;padding:12px 16px;text-align:right;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a2e;">📋 تفاصيل الحجز</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              <table width="100%" cellpadding="10" cellspacing="0" style="font-size:13px;">
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="font-weight:700;color:#1a1a2e;text-align:right;">${hotelName}</td>
                  <td style="color:#888;text-align:left;">اسم الفندق</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="font-weight:700;color:#1a1a2e;text-align:right;">${roomName}</td>
                  <td style="color:#888;text-align:left;">نوع الغرفة</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="font-weight:700;color:#1a1a2e;text-align:right;">${checkInFmt}</td>
                  <td style="color:#888;text-align:left;">تاريخ الوصول</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="font-weight:700;color:#1a1a2e;text-align:right;">${checkOutFmt}</td>
                  <td style="color:#888;text-align:left;">تاريخ المغادرة</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="font-weight:700;color:#1a1a2e;text-align:right;">${nights} ليلة</td>
                  <td style="color:#888;text-align:left;">عدد الليالي</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="font-weight:700;color:#1a1a2e;text-align:right;">${booking.guests_count ?? 1} ضيف</td>
                  <td style="color:#888;text-align:left;">عدد الضيوف</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="font-weight:700;color:#1a1a2e;text-align:right;">$${booking.total_price}</td>
                  <td style="color:#888;text-align:left;">المبلغ الإجمالي</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="font-weight:700;color:#16a34a;text-align:right;">✅ $${booking.deposit_amount} (مدفوع)</td>
                  <td style="color:#888;text-align:left;">العربون 10%</td>
                </tr>
                <tr>
                  <td style="font-weight:700;color:#b45309;text-align:right;">💵 $${balance} نقداً عند الوصول</td>
                  <td style="color:#888;text-align:left;">الباقي</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="color:#555;font-size:14px;line-height:1.8;direction:rtl;text-align:right;">
          تم تأكيد حجزك بنجاح، ونتطلع إلى توفير تجربة إقامة مميزة لك.
        </p>
        <p style="color:#555;font-size:14px;line-height:1.8;direction:rtl;text-align:right;">
          في حال كان لديك أي استفسار يرجى التواصل مع فريق الدعم:
        </p>
        <p style="direction:rtl;text-align:right;margin:4px 0 16px;">
          <a href="mailto:support@naity.net" style="color:#2563eb;font-weight:700;">support@naity.net</a>
        </p>
        <p style="color:#555;font-size:14px;line-height:1.8;direction:rtl;text-align:right;">
          مع أطيب التحيات،<br/>فريق Naity
        </p>

        <!-- ===== DIVIDER ===== -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
          <tr>
            <td style="border-top:2px solid #e5e7eb;"></td>
          </tr>
        </table>

        <!-- ===== ENGLISH SECTION ===== -->
        <p style="color:#333;font-size:15px;line-height:1.8;direction:ltr;text-align:left;">
          Dear ${guestName},
        </p>
        <p style="color:#555;font-size:14px;line-height:1.8;direction:ltr;text-align:left;">
          Thank you for choosing Naity for your stay.
          Your reservation has been successfully confirmed.
          Please find your booking details below:
        </p>

        <!-- EN Booking Details Table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:#f0f4ff;padding:12px 16px;text-align:left;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a2e;">📋 Booking Details</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              <table width="100%" cellpadding="10" cellspacing="0" style="font-size:13px;">
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="color:#888;">Hotel Name</td>
                  <td style="font-weight:700;color:#1a1a2e;">${hotelName}</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="color:#888;">Room Type</td>
                  <td style="font-weight:700;color:#1a1a2e;">${roomName}</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="color:#888;">Check-in Date</td>
                  <td style="font-weight:700;color:#1a1a2e;">${checkInFmt}</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="color:#888;">Check-out Date</td>
                  <td style="font-weight:700;color:#1a1a2e;">${checkOutFmt}</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="color:#888;">Number of Nights</td>
                  <td style="font-weight:700;color:#1a1a2e;">${nights} night${nights > 1 ? "s" : ""}</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="color:#888;">Number of Guests</td>
                  <td style="font-weight:700;color:#1a1a2e;">${booking.guests_count ?? 1} guest${(booking.guests_count ?? 1) > 1 ? "s" : ""}</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="color:#888;font-weight:700;">Total Amount</td>
                  <td style="font-weight:700;color:#1a1a2e;">$${booking.total_price}</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="color:#16a34a;font-weight:700;">Deposit Paid (10%)</td>
                  <td style="font-weight:700;color:#16a34a;">✅ $${booking.deposit_amount}</td>
                </tr>
                <tr>
                  <td style="color:#b45309;font-weight:700;">Balance at Check-in</td>
                  <td style="font-weight:700;color:#b45309;">💵 $${balance} (cash)</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Booking Reference -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:#f5f5ff;padding:16px;text-align:center;">
              <p style="color:#999;font-size:11px;margin:0 0 4px;">🔑 Booking Reference</p>
              <p style="font-family:monospace;font-size:20px;font-weight:bold;color:#1a1a2e;margin:0;letter-spacing:1px;">${txHash}</p>
            </td>
          </tr>
        </table>

        <!-- Warning -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
          <tr>
            <td style="background:#fff3cd;border-radius:10px;padding:16px;">
              <p style="color:#856404;font-size:13px;margin:0;line-height:1.7;">
                <strong>⚠️ Important at Check-in:</strong><br/>
                Please show this email at hotel reception and pay the
                remaining <strong>$${balance}</strong> in cash.
              </p>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td style="text-align:center;">
              <a href="${APP_URL}/my-bookings" style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">📱 Track My Bookings</a>
            </td>
          </tr>
        </table>

        <p style="color:#555;font-size:14px;line-height:1.8;direction:ltr;text-align:left;">
          We look forward to welcoming you and hope you have a comfortable
          and enjoyable stay.
        </p>
        <p style="color:#555;font-size:14px;line-height:1.8;direction:ltr;text-align:left;">
          If you need any assistance, please contact us at:
          <a href="mailto:support@naity.net" style="color:#2563eb;font-weight:700;">support@naity.net</a>
        </p>
        <p style="color:#555;font-size:14px;line-height:1.8;direction:ltr;text-align:left;">
          Best regards,<br/>Naity Team
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#1a1a2e;padding:20px;text-align:center;">
        <p style="color:#a0a0b0;font-size:12px;margin:0;">
          © 2025 Naity — All rights reserved
        </p>
        <p style="color:#666;font-size:11px;margin:6px 0 0;">
          naity.net · support@naity.net
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await sendEmail(
        guestEmail!,
        `✅ تأكيد الحجز | Booking Confirmed — ${hotelName} · ${checkInFmt} → ${checkOutFmt}`,
        guestEmailHtml
      );
    } catch (emailErr) {
      console.error("Guest email failed:", emailErr);
    }

    // Hotel notification email
    const hotelEmail = booking.hotels?.contact_email;
    // ── Notify Hotel Local System ──────────────────────────
    const APP_SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    try {
      await fetch(`${APP_SUPABASE_URL}/functions/v1/send-booking-to-hotel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ booking_id: bookingId }),
      });
    } catch (hotelNotifyErr) {
      console.error("Hotel system notification failed:", hotelNotifyErr);
    }
    // ── End Hotel Notification ───────────────────────────

    if (hotelEmail) {
      const hotelEmailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto">
<tr><td style="background:#1a1a2e;padding:24px;text-align:center">
<h1 style="color:#ffffff;margin:0;font-size:24px">Naity</h1>
<p style="color:#a0a0b0;margin:4px 0 0;font-size:13px">New Booking Notification</p>
</td></tr>
<tr><td style="padding:32px 24px;text-align:center">
<p style="font-size:48px;margin:0">🔔</p>
<h2 style="color:#1a1a2e;margin:16px 0 8px">New Booking Received!</h2>
<p style="color:#666;font-size:14px">A guest has confirmed and paid the deposit via Naity.</p>
</td></tr>
<tr><td style="padding:0 24px">
<h3 style="color:#1a1a2e">👤 Guest Information</h3>
<table width="100%" style="border:1px solid #eee;border-radius:8px" cellpadding="12">
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Full Name</td><td style="font-weight:bold;border-bottom:1px solid #eee">${booking.guest_first_name} ${booking.guest_last_name}</td></tr>
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Email</td><td style="border-bottom:1px solid #eee">${booking.guest_email}</td></tr>
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Phone</td><td style="border-bottom:1px solid #eee">${booking.guest_phone ?? "—"}</td></tr>
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Nationality</td><td style="border-bottom:1px solid #eee">${booking.nationality ?? "—"}</td></tr>
<tr><td style="color:#999;font-size:12px">Guests</td><td>${booking.guests_count ?? 1} person(s)</td></tr>
</table>
<h3 style="color:#1a1a2e;margin-top:24px">🛏 Stay Details</h3>
<table width="100%" style="border:1px solid #eee;border-radius:8px" cellpadding="12">
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Room</td><td style="border-bottom:1px solid #eee">${roomName}</td></tr>
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Check-in</td><td style="border-bottom:1px solid #eee">${checkInFmt}</td></tr>
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Check-out</td><td style="border-bottom:1px solid #eee">${checkOutFmt}</td></tr>
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Nights</td><td style="border-bottom:1px solid #eee">${nights}</td></tr>
${booking.special_requests ? `<tr><td style="color:#999;font-size:12px">Special Requests</td><td>"${booking.special_requests}"</td></tr>` : ""}
</table>
<h3 style="color:#1a1a2e;margin-top:24px">💳 Payment</h3>
<table width="100%" style="border:1px solid #eee;border-radius:8px" cellpadding="12">
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Total</td><td style="font-weight:bold;border-bottom:1px solid #eee">$${booking.total_price}</td></tr>
<tr><td style="color:#4caf50;font-size:12px;border-bottom:1px solid #eee">Deposit Paid</td><td style="color:#4caf50;font-weight:bold;border-bottom:1px solid #eee">$${booking.deposit_amount}</td></tr>
<tr><td style="color:#999;font-size:12px">Balance (cash at hotel)</td><td style="font-weight:bold">$${balance}</td></tr>
</table>
<div style="background:#f5f5ff;border-radius:8px;padding:16px;text-align:center;margin:24px 0">
<p style="color:#999;font-size:11px;margin:0 0 4px">Booking Reference</p>
<p style="font-family:monospace;font-size:18px;font-weight:bold;color:#1a1a2e;margin:0">${txHash}</p>
</div>
</td></tr>
<tr><td style="background:#f8f8f8;padding:20px;text-align:center;border-top:1px solid #eee">
<p style="color:#999;font-size:12px;margin:0">© 2025 Naity — Automated Booking Notification</p>
</td></tr>
</table>
</body></html>`;

      try {
        await sendEmail(
          hotelEmail,
          `🔔 New Booking: ${booking.guest_first_name} ${booking.guest_last_name} · ${checkInFmt} → ${checkOutFmt}`,
          hotelEmailHtml
        );
      } catch (emailErr) {
        console.error("Hotel email failed:", emailErr);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
