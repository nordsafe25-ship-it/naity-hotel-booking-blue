/**
 * Multi-Provider Hotel Booking Architecture — Shared Types
 *
 * Every provider module normalizes its data into these shapes,
 * so the rest of the app never deals with provider-specific formats.
 */

/** A single room returned by any provider */
export interface NormalizedRoom {
  id: string;
  hotelId: string;
  roomId: string;
  name: string;
  nameAr: string;
  price: number;
  beds: number;
  status: "available" | "occupied" | "maintenance" | "unlisted";
  availableTo: string | null; // ISO date or null
  categoryId: string | null;
  categoryName: string | null;
}

/** Outbound booking payload sent to a provider */
export interface BookingRequest {
  hotelId: string;
  roomId: string;
  roomNumber?: string | null;
  checkIn: string;
  checkOut: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string | null;
  nationality?: string | null;
  guestsCount: number;
  totalPrice: number;
  depositAmount: number;
  specialRequests?: string | null;
}

/** Result after attempting to book through a provider */
export interface BookingResult {
  success: boolean;
  providerBookingId?: string;
  message?: string;
}

/** Provider info stored in api_companies */
export interface ProviderInfo {
  id: string;
  name: string;
  apiKey: string;
  status: string;
  baseUrl?: string | null;
}

/**
 * Every provider module must implement this interface.
 * Adding a new provider = create file + implement HotelProvider + register in router.
 */
export interface HotelProvider {
  /** Unique slug, e.g. "chamsoft", "company2" */
  readonly slug: string;

  /** Fetch rooms from the provider's external API */
  getRooms(hotelExternalId: number, provider: ProviderInfo): Promise<NormalizedRoom[]>;

  /** Push a booking to the provider's system */
  bookRoom(booking: BookingRequest, provider: ProviderInfo): Promise<BookingResult>;
}
