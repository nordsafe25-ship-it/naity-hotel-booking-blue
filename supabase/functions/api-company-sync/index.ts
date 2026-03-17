import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildHeaders(company: Record<string, unknown>): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (company.auth_type === "api_key" && company.api_key) {
    headers["X-API-Key"] = String(company.api_key);
  } else if (company.auth_type === "token" && company.api_token) {
    headers["Authorization"] = `Bearer ${company.api_token}`;
  } else if (company.auth_type === "basic" && company.username && company.password) {
    const b64 = btoa(`${company.username}:${company.password}`);
    headers["Authorization"] = `Basic ${b64}`;
  }
  return headers;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, company_id, hotel_id, booking_id } = await req.json();

    // Fetch company
    const { data: company, error: compErr } = await supabase
      .from("api_companies")
      .select("*")
      .eq("id", company_id)
      .eq("status", "active")
      .single();

    if (compErr || !company) {
      return jsonResponse({ error: "Company not found or inactive" }, 404);
    }

    const headers = buildHeaders(company);

    // ── ACTION: test_connection ─────────────────────────
    if (action === "test_connection") {
      const url = (company.base_url ?? "") + (company.get_rooms_path ?? "");
      try {
        const res = await fetch(url, {
          method: "GET",
          headers,
          signal: AbortSignal.timeout(8000),
        });
        const ok = res.ok;
        await supabase.from("api_sync_logs").insert({
          company_id,
          event_type: "test_connection",
          direction: "outbound",
          status: ok ? "success" : "error",
          request_url: url,
          error_msg: ok ? null : `HTTP ${res.status}`,
        });
        return jsonResponse({ success: ok, status: res.status });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        await supabase.from("api_sync_logs").insert({
          company_id,
          event_type: "test_connection",
          direction: "outbound",
          status: "error",
          request_url: url,
          error_msg: msg,
        });
        return jsonResponse({ success: false, error: msg }, 500);
      }
    }

    // ── ACTION: sync_rooms ──────────────────────────────
    if (action === "sync_rooms") {
      const url = (company.base_url ?? "") + (company.get_rooms_path ?? "");

      let data: unknown;
      let res: Response;
      try {
        res = await fetch(url, { method: "GET", headers, signal: AbortSignal.timeout(15000) });
        data = await res.json();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        await supabase.from("api_sync_logs").insert({
          company_id,
          hotel_id: hotel_id ?? null,
          event_type: "sync_rooms",
          direction: "inbound",
          status: "error",
          request_url: url,
          error_msg: msg,
        });
        return jsonResponse({ success: false, error: msg }, 500);
      }

      // Log the sync
      await supabase.from("api_sync_logs").insert({
        company_id,
        hotel_id: hotel_id ?? null,
        event_type: "sync_rooms",
        direction: "inbound",
        status: res.ok ? "success" : "error",
        request_url: url,
        response: Array.isArray(data)
          ? { count: data.length, sample: data[0] ?? null }
          : (data as Record<string, unknown>),
        error_msg: res.ok ? null : `HTTP ${res.status}`,
      });

      // Upsert rooms into room_availability
      if (res.ok && Array.isArray(data) && hotel_id) {
        let synced = 0;
        for (const room of data) {
          const roomStatus =
            String(room.Status ?? "").toLowerCase() === "available"
              ? "available"
              : "occupied";
          await supabase.from("room_availability").upsert(
            {
              hotel_id,
              room_number: String(room.RoomId ?? room.room_id ?? room.id),
              sham_soft_room_id: String(room.RoomId ?? room.room_id ?? room.id),
              category_name: room.CategoryName ?? `Bed ${room.Bed ?? 1}`,
              status: roomStatus,
              price_per_night: Number(room.Price ?? room.price ?? 0),
              last_updated_by_hotel: new Date().toISOString(),
            },
            { onConflict: "hotel_id,room_number" }
          );
          synced++;
        }

        // Update last_sync_at
        await supabase
          .from("api_companies")
          .update({ last_sync_at: new Date().toISOString() })
          .eq("id", company_id);

        return jsonResponse({ success: true, rooms_synced: synced });
      }

      return jsonResponse({
        success: res.ok,
        rooms: Array.isArray(data) ? data.length : 0,
      });
    }

    // ── ACTION: send_booking ────────────────────────────
    if (action === "send_booking" && booking_id) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("*, hotels(*), room_categories(*)")
        .eq("id", booking_id)
        .single();

      if (!booking) {
        return jsonResponse({ error: "Booking not found" }, 404);
      }

      const hotel = booking.hotels as Record<string, unknown> | null;
      const url = (company.base_url ?? "") + (company.post_booking_path ?? "");

      const payload = {
        HotelId: hotel?.external_hotel_id ?? hotel?.id,
        RoomId: booking.room_number ?? null,
        Price: booking.total_price,
        Bed: booking.guests_count ?? 1,
        Status: "booked",
        YesToDate: booking.check_out,
        CheckIn: booking.check_in,
        GuestName: `${booking.guest_first_name} ${booking.guest_last_name}`,
        GuestPhone: booking.guest_phone,
        BookingRef: booking.transaction_hash,
      };

      let responseData: unknown = {};
      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        responseData = await res.json().catch(() => ({}));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        await supabase.from("api_sync_logs").insert({
          company_id,
          hotel_id: booking.hotel_id,
          event_type: "send_booking",
          direction: "outbound",
          status: "error",
          request_url: url,
          response: payload,
          error_msg: msg,
        });
        return jsonResponse({ success: false, error: msg }, 500);
      }

      await supabase.from("api_sync_logs").insert({
        company_id,
        hotel_id: booking.hotel_id,
        event_type: "send_booking",
        direction: "outbound",
        status: res.ok ? "success" : "error",
        request_url: url,
        response: responseData as Record<string, unknown>,
        error_msg: res.ok ? null : `HTTP ${res.status}`,
      });

      return jsonResponse({ success: res.ok, response: responseData });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: msg }, 500);
  }
});
