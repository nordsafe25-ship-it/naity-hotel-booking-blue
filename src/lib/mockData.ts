// Mock data has been removed. The app now uses real hotel data from the database.
// These type interfaces are kept for backward compatibility.

export interface Hotel {
  id: string;
  name: string;
  city: string;
  stars: number;
  pricePerNight: number;
  image: string;
  description: string;
  amenities: string[];
  rating: number;
  reviewCount: number;
}

export interface Room {
  id: string;
  hotelId: string;
  type: string;
  price: number;
  capacity: number;
  available: boolean;
  amenities: string[];
  image: string;
}

export const hotels: Hotel[] = [];
export const getRooms = (_hotelId: string): Room[] => [];
export const cities: string[] = [];
