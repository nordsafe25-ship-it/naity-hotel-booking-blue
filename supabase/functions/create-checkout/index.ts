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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // ── Double-booking prevention ──────────────────────────
    // For apartments: check blocked_dates AND existing confirmed bookings
    const { data: hotel } = await supabase
      .from("hotels")
      .select("property_type, manual_mode")
      .eq("id", hotel_id)
      .single();

    const isApartment = hotel?.property_type === "apartment";

    if (isApartment) {
      // Check blocked dates
      const { data: blocked } = await supabase
        .from("blocked_dates")
        .select("id")
        .eq("hotel_id", hotel_id)
        .gte("blocked_date", check_in)
        .lt("blocked_date", check_out)
        .limit(1);

      if (blocked && blocked.length > 0) {
        return new Response(
          JSON.stringify({ error: "Selected dates are not available for this apartment." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check overlapping confirmed/active bookings for the same property + room
    const overlapQuery = supabase
      .from("bookings")
      .select("id")
      .eq("hotel_id", hotel_id)
      .eq("room_category_id", room_category_id)
      .in("status", ["confirmed", "active", "checked_in"])
      .lt("check_in", check_out)
      .gt("check_out", check_in);

    // For synced hotels with a specific room_number, narrow the overlap check
    if (body.room_number) {
      overlapQuery.eq("room_number", body.room_number);
    }

    const { data: overlapping } = await overlapQuery.limit(1);

    if (overlapping && overlapping.length > 0) {
      // For apartments, any overlap = blocked
      // For hotels with specific room, that room is taken
      // For hotels without room_number (manual mode), check against total_rooms
      if (isApartment || body.room_number) {
        return new Response(
          JSON.stringify({ error: "This room is already booked for the selected dates." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // For manual-mode hotels without room_number, check total capacity
      const { data: roomCat } = await supabase
        .from("room_categories")
        .select("total_rooms")
        .eq("id", room_category_id)
        .single();

      const { count: overlapCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("hotel_id", hotel_id)
        .eq("room_category_id", room_category_id)
        .in("status", ["confirmed", "active", "checked_in"])
        .lt("check_in", check_out)
        .gt("check_out", check_in);

      if (roomCat && (overlapCount ?? 0) >= roomCat.total_rooms) {
        return new Response(
          JSON.stringify({ error: "No rooms available for the selected dates." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // ── End double-booking prevention ──────────────────────

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
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
