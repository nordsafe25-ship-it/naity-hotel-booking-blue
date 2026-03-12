import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      hotel_id, room_category_id,
      guest_first_name, guest_last_name, guest_email, guest_phone,
      nationality, guests_count,
      check_in, check_out, nights,
      total_price, deposit_amount,
      special_requests,
      hotel_name, room_name,
    } = body;

    const APP_URL = Deno.env.get("APP_URL") ?? "https://naity.com";

    const txHash = `NTY-${Date.now().toString(36).toUpperCase()}-${
      Math.random().toString(36).substring(2, 8).toUpperCase()
    }`;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        hotel_id,
        room_category_id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_phone: guest_phone ?? null,
        nationality: nationality ?? null,
        guests_count: guests_count ?? 1,
        check_in,
        check_out,
        total_price,
        deposit_amount,
        special_requests: special_requests ?? null,
        transaction_hash: txHash,
        payment_status: "pending",
        status: "pending",
        sync_status: "pending",
        room_number: body.room_number ?? null,
      })
      .select("id")
      .single();

    if (bookingError) throw bookingError;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: guest_email,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `${hotel_name} — ${room_name}`,
            description: [
              `${nights} night${nights > 1 ? "s" : ""}`,
              `Check-in: ${check_in}`,
              `Check-out: ${check_out}`,
              `${guests_count} guest${guests_count > 1 ? "s" : ""}`,
              `10% deposit — balance $${total_price - deposit_amount} cash at hotel`,
            ].join(" · "),
          },
          unit_amount: Math.round(deposit_amount * 100),
        },
        quantity: 1,
      }],
      metadata: {
        booking_id: booking.id,
        transaction_hash: txHash,
        hotel_id,
        guest_email,
        guest_name: `${guest_first_name} ${guest_last_name}`,
        nationality: nationality ?? "",
        guests_count: String(guests_count ?? 1),
      },
      success_url: `${APP_URL}/booking?session_id={CHECKOUT_SESSION_ID}&room_number=${encodeURIComponent(body.room_number ?? "")}&check_in=${check_in}&check_out=${check_out}`,
      cancel_url: `${APP_URL}/booking?hotel=${hotel_id}&room=${room_category_id}&room_number=${encodeURIComponent(body.room_number ?? "")}&check_in=${check_in}&check_out=${check_out}`,
    });

    await supabase.from("bookings")
      .update({ stripe_payment_id: session.id })
      .eq("id", booking.id);

    return new Response(
      JSON.stringify({ url: session.url, booking_id: booking.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
