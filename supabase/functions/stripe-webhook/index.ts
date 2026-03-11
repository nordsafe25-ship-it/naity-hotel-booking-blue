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

    // Guest confirmation email
    const guestEmailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto">
<tr><td style="background:#1a1a2e;padding:24px;text-align:center">
<h1 style="color:#ffffff;margin:0;font-size:24px">Naity</h1>
<p style="color:#a0a0b0;margin:4px 0 0;font-size:13px">We Prepare Your Stay</p>
</td></tr>
<tr><td style="padding:32px 24px;text-align:center">
<p style="font-size:48px;margin:0">✅</p>
<h2 style="color:#1a1a2e;margin:16px 0 8px">Booking Confirmed!</h2>
<p style="color:#666;font-size:14px">Your 10% deposit was received. Your stay is secured.</p>
</td></tr>
<tr><td style="padding:0 24px">
<p style="color:#333;font-size:14px">Hi ${guestName},</p>
<p style="color:#666;font-size:14px">Thank you for choosing Naity. Here are your booking details:</p>
<table width="100%" style="border:1px solid #eee;border-radius:8px;margin:16px 0" cellpadding="12">
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Hotel</td><td style="font-weight:bold;border-bottom:1px solid #eee">${hotelName}</td></tr>
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Room</td><td style="border-bottom:1px solid #eee">${roomName}</td></tr>
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Check-in</td><td style="border-bottom:1px solid #eee">${checkInFmt}</td></tr>
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Check-out</td><td style="border-bottom:1px solid #eee">${checkOutFmt}</td></tr>
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Duration</td><td style="border-bottom:1px solid #eee">${nights} night${nights > 1 ? "s" : ""}</td></tr>
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Guests</td><td style="border-bottom:1px solid #eee">${booking.guests_count ?? 1}</td></tr>
<tr><td style="color:#999;font-size:12px">Nationality</td><td>${booking.nationality ?? "—"}</td></tr>
</table>
<table width="100%" style="border:1px solid #eee;border-radius:8px;margin:16px 0" cellpadding="12">
<tr><td style="color:#999;font-size:12px;border-bottom:1px solid #eee">Total Price</td><td style="font-weight:bold;border-bottom:1px solid #eee">$${booking.total_price}</td></tr>
<tr><td style="color:#4caf50;font-size:12px;border-bottom:1px solid #eee">✅ Deposit Paid (10%)</td><td style="color:#4caf50;font-weight:bold;border-bottom:1px solid #eee">$${booking.deposit_amount}</td></tr>
<tr><td style="color:#999;font-size:12px">Balance Due at Hotel</td><td style="font-weight:bold">$${balance} (cash)</td></tr>
</table>
<div style="background:#f5f5ff;border-radius:8px;padding:16px;text-align:center;margin:16px 0">
<p style="color:#999;font-size:11px;margin:0 0 4px">Booking Reference</p>
<p style="font-family:monospace;font-size:18px;font-weight:bold;color:#1a1a2e;margin:0">${txHash}</p>
</div>
<div style="background:#fff3cd;border-radius:8px;padding:16px;margin:16px 0">
<p style="color:#856404;font-size:13px;margin:0"><strong>⚠️ At Check-in:</strong> Show this email or open <a href="${APP_URL}/my-bookings">naity.com/my-bookings</a> at reception. Pay the remaining <strong>$${balance}</strong> in cash.</p>
</div>
<div style="text-align:center;margin:24px 0">
<a href="${APP_URL}/my-bookings" style="background:#1a1a2e;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;display:inline-block">📱 Track My Bookings</a>
</div>
</td></tr>
<tr><td style="background:#f8f8f8;padding:20px;text-align:center;border-top:1px solid #eee">
<p style="color:#999;font-size:12px;margin:0">© 2025 Naity — All rights reserved</p>
<p style="color:#bbb;font-size:11px;margin:4px 0 0">We Prepare Your Stay · Syria's Hotel Booking Platform</p>
</td></tr>
</table>
</body></html>`;

    try {
      await sendEmail(
        guestEmail!,
        `✅ Confirmed: ${hotelName} · ${checkInFmt} → ${checkOutFmt} | Naity`,
        guestEmailHtml
      );
    } catch (emailErr) {
      console.error("Guest email failed:", emailErr);
    }

    // Hotel notification email
    const hotelEmail = booking.hotels?.contact_email;
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
