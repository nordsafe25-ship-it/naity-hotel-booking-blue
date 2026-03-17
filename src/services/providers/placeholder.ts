/**
 * Placeholder Provider Module
 *
 * Template for adding new hotel software companies.
 * To add a new provider:
 *   1. Copy this file → src/services/providers/yourcompany.ts
 *   2. Implement getRooms() and bookRoom() with provider-specific API calls
 *   3. Add a normalizer in normalizers.ts if needed
 *   4. Register in apiRouter.ts providerRegistry
 *
 * That's it. No other changes required.
 */

import type { HotelProvider, NormalizedRoom, BookingRequest, BookingResult, ProviderInfo } from "../types";
import { normalizeGenericRoom } from "../normalizers";

/**
 * Creates a placeholder provider for companies not yet integrated.
 * Returns empty rooms and logs booking attempts.
 */
export function createPlaceholderProvider(slug: string): HotelProvider {
  return {
    slug,

    async getRooms(hotelExternalId: number, _provider: ProviderInfo): Promise<NormalizedRoom[]> {
      console.warn(`[${slug}] Provider not yet implemented. Returning empty rooms for hotel ${hotelExternalId}.`);
      // When implemented, call the provider's API here and normalize the response
      // Example:
      // const res = await fetch(`${provider.baseUrl}/rooms?hotel=${hotelExternalId}`, { ... });
      // const data = await res.json();
      // return data.map(r => normalizeGenericRoom(r, String(hotelExternalId), slug));
      return [];
    },

    async bookRoom(booking: BookingRequest, _provider: ProviderInfo): Promise<BookingResult> {
      console.warn(`[${slug}] Provider not yet implemented. Cannot book room.`, booking);
      return {
        success: false,
        message: `Provider "${slug}" is not yet integrated. Booking saved locally only.`,
      };
    },
  };
}

// Pre-built placeholders for the 7 remaining companies
export const company2Provider = createPlaceholderProvider("company2");
export const company3Provider = createPlaceholderProvider("company3");
export const company4Provider = createPlaceholderProvider("company4");
export const company5Provider = createPlaceholderProvider("company5");
export const company6Provider = createPlaceholderProvider("company6");
export const company7Provider = createPlaceholderProvider("company7");
export const company8Provider = createPlaceholderProvider("company8");
