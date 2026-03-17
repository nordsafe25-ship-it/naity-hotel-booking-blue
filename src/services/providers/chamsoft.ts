/**
 * ChamSoft Provider Module
 *
 * Integrates with ChamSoft Hotel API:
 *   https://naity.net/old/API/ChamSoft/Hotel_api.php
 *
 * Data flow:
 *   1. ChamSoft pushes rooms → hotel-company-api edge function → Supabase
 *   2. This module can also pull directly from ChamSoft's REST API
 *   3. Bookings are pushed via send-booking-to-hotel edge function
 */

import type { HotelProvider, NormalizedRoom, BookingRequest, BookingResult, ProviderInfo } from "../types";
import { normalizeChamSoftRoom } from "../normalizers";

const CHAMSOFT_BASE_URL = "https://naity.net/old/API/ChamSoft";

export const chamsoftProvider: HotelProvider = {
  slug: "chamsoft",

  async getRooms(hotelExternalId: number, provider: ProviderInfo): Promise<NormalizedRoom[]> {
    try {
      const baseUrl = provider.baseUrl || CHAMSOFT_BASE_URL;
      const response = await fetch(`${baseUrl}/Hotel_api.php?HotelId=${hotelExternalId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(provider.apiKey ? { "X-API-KEY": provider.apiKey } : {}),
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.error(`[ChamSoft] HTTP ${response.status} for hotel ${hotelExternalId}`);
        return [];
      }

      const data = await response.json();
      const rooms = Array.isArray(data) ? data : data?.rooms ?? data?.data ?? [];

      return rooms.map((raw: Record<string, unknown>) =>
        normalizeChamSoftRoom(raw as any, String(hotelExternalId))
      );
    } catch (error) {
      console.error("[ChamSoft] getRooms error:", error);
      return [];
    }
  },

  async bookRoom(booking: BookingRequest, provider: ProviderInfo): Promise<BookingResult> {
    try {
      const baseUrl = provider.baseUrl || CHAMSOFT_BASE_URL;

      // Transform booking to ChamSoft's expected format
      const payload = {
        HotelId: booking.hotelId,
        RoomId: booking.roomId,
        RoomNumber: booking.roomNumber,
        GuestName: `${booking.guestFirstName} ${booking.guestLastName}`,
        GuestEmail: booking.guestEmail,
        GuestPhone: booking.guestPhone,
        CheckIn: booking.checkIn,
        CheckOut: booking.checkOut,
        TotalPrice: booking.totalPrice,
        DepositPaid: booking.depositAmount,
        SpecialRequests: booking.specialRequests,
      };

      const response = await fetch(`${baseUrl}/booking-confirmed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { success: false, message: `ChamSoft returned HTTP ${response.status}` };
      }

      const result = await response.json();
      return {
        success: true,
        providerBookingId: result?.hotel_booking_id ?? result?.booking_id,
        message: "Booking confirmed by ChamSoft",
      };
    } catch (error) {
      console.error("[ChamSoft] bookRoom error:", error);
      return { success: false, message: String(error) };
    }
  },
};
