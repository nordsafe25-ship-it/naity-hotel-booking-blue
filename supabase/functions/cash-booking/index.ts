import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const {
      hotel_id, room_category_id, guest_first_name, guest_last_name,
      guest_email, guest_phone, nationality, guests_count,
      children_count, children_ages, breakfast_included,
      check_in, check_out, nights, total_price,
      special_requests, room_number, extra_room,
    } = body;

    if (!hotel_id || !room_category_id || !guest_first_name || !guest_last_name || !guest_email || !check_in || !check_out) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the booking with cash payment method
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        hotel_id,
        room_category_id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_phone: guest_phone || null,
        nationality: nationality || null,
        guests_count: guests_count || 1,
        children_count: children_count || 0,
        children_ages: children_ages || [],
        breakfast_included: breakfast_included || false,
        check_in,
        check_out,
        total_price,
        deposit_amount: 0,
        payment_status: "cash_on_arrival",
        status: "confirmed",
        special_requests: special_requests || null,
        room_number: room_number || null,
      })
      .select("id")
      .single();

    if (bookingError) {
      console.error("Booking insert error:", bookingError);
      return new Response(
        JSON.stringify({ success: false, message: bookingError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If extra room, create booking_rooms entry
    if (extra_room && booking) {
      await supabase.from("booking_rooms").insert({
        booking_id: booking.id,
        room_category_id: extra_room.room_category_id,
        price_per_night: extra_room.price_per_night,
        deposit_amount: 0,
        guests_count: 1,
      });
    }

    // Try to notify the hotel
    try {
      await supabase.functions.invoke("send-booking-to-hotel", {
        body: { booking_id: booking.id },
      });
    } catch {
      // Non-blocking
    }

    return new Response(
      JSON.stringify({ success: true, booking_id: booking.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Cash booking error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
