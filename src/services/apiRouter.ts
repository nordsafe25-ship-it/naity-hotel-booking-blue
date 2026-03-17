/**
 * API Router — Central routing for multi-provider hotel booking
 *
 * Routes requests to the correct provider based on hotel.company_id.
 * Falls back to Supabase data when no external provider is configured.
 *
 * Adding a new provider:
 *   1. Create provider file in src/services/providers/
 *   2. Register it in providerRegistry below
 *   3. Done!
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  HotelProvider,
  NormalizedRoom,
  BookingRequest,
  BookingResult,
  ProviderInfo,
} from "./types";
import { normalizeSupabaseRoom } from "./normalizers";

// --- Provider Registry ---
import { chamsoftProvider } from "./providers/chamsoft";
import {
  company2Provider,
  company3Provider,
  company4Provider,
  company5Provider,
  company6Provider,
  company7Provider,
  company8Provider,
} from "./providers/placeholder";

/**
 * Registry: maps company name (lowercase) to provider module.
 * When adding a new provider, just add one line here.
 */
const providerRegistry: Record<string, HotelProvider> = {
  chamsoft: chamsoftProvider,
  company2: company2Provider,
  company3: company3Provider,
  company4: company4Provider,
  company5: company5Provider,
  company6: company6Provider,
  company7: company7Provider,
  company8: company8Provider,
};

/**
 * Resolve which provider module handles a given company name.
 */
function resolveProvider(companyName: string): HotelProvider | null {
  const key = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Try exact match first, then prefix match
  if (providerRegistry[key]) return providerRegistry[key];
  const match = Object.keys(providerRegistry).find((k) => key.startsWith(k));
  return match ? providerRegistry[match] : null;
}

/**
 * Fetch provider info for a hotel from Supabase.
 */
async function getProviderForHotel(hotelId: string): Promise<{
  provider: ProviderInfo | null;
  externalHotelId: number | null;
}> {
  const { data: hotel } = await supabase
    .from("hotels")
    .select("company_id, external_hotel_id")
    .eq("id", hotelId)
    .single();

  if (!hotel?.company_id) {
    return { provider: null, externalHotelId: null };
  }

  const { data: company } = await supabase
    .from("api_companies")
    .select("*")
    .eq("id", hotel.company_id)
    .eq("status", "active")
    .single();

  if (!company) {
    return { provider: null, externalHotelId: hotel.external_hotel_id };
  }

  // Check local_sync_settings for base_url
  const { data: syncSettings } = await supabase
    .from("local_sync_settings")
    .select("api_endpoint")
    .eq("hotel_id", hotelId)
    .single();

  return {
    provider: {
      id: company.id,
      name: company.name,
      apiKey: company.api_key,
      status: company.status,
      baseUrl: syncSettings?.api_endpoint ?? null,
    },
    externalHotelId: hotel.external_hotel_id,
  };
}

// ═══════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════

/**
 * Get rooms for a hotel — routes to the correct provider or falls back to Supabase.
 */
export async function getRoomsByHotel(hotelId: string): Promise<NormalizedRoom[]> {
  try {
    const { provider, externalHotelId } = await getProviderForHotel(hotelId);

    // If hotel has a linked provider with external ID, try the provider first
    if (provider && externalHotelId != null) {
      const providerModule = resolveProvider(provider.name);
      if (providerModule) {
        const rooms = await providerModule.getRooms(externalHotelId, provider);
        if (rooms.length > 0) return rooms;
        // Fall through to Supabase if provider returns nothing
      }
    }

    // Fallback: read from Supabase room_availability
    const { data } = await supabase
      .from("room_availability")
      .select("*")
      .eq("hotel_id", hotelId)
      .eq("status", "available");

    return (data || []).map((row) => normalizeSupabaseRoom(row as Record<string, unknown>));
  } catch (error) {
    console.error("[apiRouter] getRoomsByHotel error:", error);
    return [];
  }
}

/**
 * Book a room — routes to the correct provider or falls back to Supabase-only booking.
 */
export async function bookRoom(booking: BookingRequest): Promise<BookingResult> {
  try {
    const { provider } = await getProviderForHotel(booking.hotelId);

    if (provider) {
      const providerModule = resolveProvider(provider.name);
      if (providerModule) {
        const result = await providerModule.bookRoom(booking, provider);
        if (result.success) return result;
        // If provider booking fails, we still have the Supabase booking
        console.warn(`[apiRouter] Provider booking failed: ${result.message}. Supabase booking still valid.`);
        return { ...result, message: `${result.message} — Booking saved locally.` };
      }
    }

    // No provider — booking is Supabase-only (already handled by BookingForm)
    return { success: true, message: "Booking saved (no external provider)." };
  } catch (error) {
    console.error("[apiRouter] bookRoom error:", error);
    return { success: false, message: String(error) };
  }
}

/**
 * Get provider info for a hotel (useful for UI display).
 */
export async function getHotelProvider(hotelId: string): Promise<ProviderInfo | null> {
  const { provider } = await getProviderForHotel(hotelId);
  return provider;
}
