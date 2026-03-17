/**
 * Normalization Layer
 *
 * Converts raw provider responses into the unified NormalizedRoom format.
 * Each provider calls the appropriate normalizer after its API call.
 */

import type { NormalizedRoom } from "./types";

/** ChamSoft raw room shape (from Hotel_api.php) */
interface ChamSoftRawRoom {
  HotelId?: number;
  RoomId?: number;
  Price?: number;
  Bed?: number;
  Status?: string;
  YesToDate?: string | null;
  RoomKind?: string;
  CategoryName?: string;
}

/**
 * Normalize a ChamSoft room into our standard format.
 */
export function normalizeChamSoftRoom(
  raw: ChamSoftRawRoom,
  hotelId: string
): NormalizedRoom {
  const status = mapStatus(raw.Status);
  return {
    id: `chamsoft-${raw.HotelId}-${raw.RoomId}`,
    hotelId,
    roomId: String(raw.RoomId ?? ""),
    name: raw.CategoryName || `Room ${raw.RoomId}`,
    nameAr: raw.CategoryName || `غرفة ${raw.RoomId}`,
    price: raw.Price ?? 0,
    beds: raw.Bed ?? 1,
    status,
    availableTo: raw.YesToDate ?? null,
    categoryId: null,
    categoryName: raw.CategoryName ?? null,
  };
}

/**
 * Normalize a generic/placeholder provider room.
 * New providers copy this pattern and adjust field mappings.
 */
export function normalizeGenericRoom(
  raw: Record<string, unknown>,
  hotelId: string,
  providerSlug: string
): NormalizedRoom {
  return {
    id: `${providerSlug}-${raw.hotel_id ?? raw.HotelId}-${raw.room_id ?? raw.RoomId}`,
    hotelId,
    roomId: String(raw.room_id ?? raw.RoomId ?? ""),
    name: String(raw.name ?? raw.room_name ?? `Room ${raw.room_id ?? raw.RoomId}`),
    nameAr: String(raw.name_ar ?? raw.room_name ?? `غرفة ${raw.room_id ?? raw.RoomId}`),
    price: Number(raw.price ?? raw.Price ?? 0),
    beds: Number(raw.beds ?? raw.Bed ?? 1),
    status: mapStatus(String(raw.status ?? raw.Status ?? "Available")),
    availableTo: raw.available_to ? String(raw.available_to) : null,
    categoryId: raw.category_id ? String(raw.category_id) : null,
    categoryName: raw.category_name ? String(raw.category_name) : null,
  };
}

/**
 * Map various status strings to our canonical statuses.
 */
function mapStatus(raw?: string): NormalizedRoom["status"] {
  if (!raw) return "available";
  const lower = raw.toLowerCase().trim();
  if (lower === "available" || lower === "free" || lower === "open") return "available";
  if (lower === "occupied" || lower === "booked" || lower === "reserved") return "occupied";
  if (lower === "maintenance" || lower === "out_of_order") return "maintenance";
  return "unlisted";
}

/**
 * Normalize Supabase room_availability rows into NormalizedRoom.
 * Used as fallback when data is already in Supabase.
 */
export function normalizeSupabaseRoom(row: Record<string, unknown>): NormalizedRoom {
  return {
    id: String(row.id),
    hotelId: String(row.hotel_id),
    roomId: String(row.room_number ?? ""),
    name: String(row.category_name ?? `Room ${row.room_number}`),
    nameAr: String(row.category_name ?? `غرفة ${row.room_number}`),
    price: Number(row.price_per_night ?? 0),
    beds: 1,
    status: mapStatus(String(row.status ?? "available")),
    availableTo: row.occupied_check_out ? String(row.occupied_check_out) : null,
    categoryId: row.room_category_id ? String(row.room_category_id) : null,
    categoryName: row.category_name ? String(row.category_name) : null,
  };
}
