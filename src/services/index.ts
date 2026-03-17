/**
 * Services barrel export
 *
 * Usage:
 *   import { getRoomsByHotel, bookRoom } from "@/services";
 */

export { getRoomsByHotel, bookRoom, getHotelProvider } from "./apiRouter";
export type {
  NormalizedRoom,
  BookingRequest,
  BookingResult,
  ProviderInfo,
  HotelProvider,
} from "./types";
