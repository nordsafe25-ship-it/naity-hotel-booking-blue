export interface Hotel {
  id: number;
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
  id: number;
  hotelId: number;
  type: string;
  price: number;
  capacity: number;
  available: boolean;
  amenities: string[];
  image: string;
}

export const hotels: Hotel[] = [
  {
    id: 1,
    name: "Azure Marina Resort",
    city: "Dubai",
    stars: 5,
    pricePerNight: 320,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    description: "A luxury beachfront resort with stunning views of the Arabian Gulf. Experience world-class dining, spa treatments, and private beach access.",
    amenities: ["Pool", "Spa", "Beach Access", "Restaurant", "Gym", "Wi-Fi", "Room Service", "Parking"],
    rating: 4.8,
    reviewCount: 1240,
  },
  {
    id: 2,
    name: "The Grand Palace Hotel",
    city: "Istanbul",
    stars: 5,
    pricePerNight: 250,
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    description: "Historic elegance meets modern luxury in the heart of Istanbul. Overlooking the Bosphorus with exceptional Turkish hospitality.",
    amenities: ["Pool", "Spa", "Restaurant", "Bar", "Gym", "Wi-Fi", "Concierge", "Valet"],
    rating: 4.7,
    reviewCount: 890,
  },
  {
    id: 3,
    name: "Skyline Business Hotel",
    city: "Riyadh",
    stars: 4,
    pricePerNight: 180,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    description: "Modern business hotel in Riyadh's financial district. Perfect for corporate travelers seeking comfort and convenience.",
    amenities: ["Business Center", "Restaurant", "Gym", "Wi-Fi", "Meeting Rooms", "Parking"],
    rating: 4.5,
    reviewCount: 560,
  },
  {
    id: 4,
    name: "Oasis Garden Hotel",
    city: "Marrakech",
    stars: 4,
    pricePerNight: 150,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    description: "A tranquil retreat surrounded by lush gardens in the heart of Marrakech. Traditional riad-style architecture with modern amenities.",
    amenities: ["Pool", "Garden", "Restaurant", "Spa", "Wi-Fi", "Airport Shuttle"],
    rating: 4.6,
    reviewCount: 720,
  },
  {
    id: 5,
    name: "Coastal Breeze Inn",
    city: "Casablanca",
    stars: 3,
    pricePerNight: 95,
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
    description: "Charming coastal hotel with ocean views and warm Moroccan hospitality. Ideal for leisure travelers on a budget.",
    amenities: ["Restaurant", "Wi-Fi", "Terrace", "Parking", "Laundry"],
    rating: 4.3,
    reviewCount: 340,
  },
  {
    id: 6,
    name: "Summit Heights Hotel",
    city: "Amman",
    stars: 4,
    pricePerNight: 130,
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    description: "Elevated luxury in Amman with panoramic city views. A blend of Jordanian charm and contemporary design.",
    amenities: ["Pool", "Restaurant", "Bar", "Gym", "Wi-Fi", "Spa", "Parking"],
    rating: 4.4,
    reviewCount: 480,
  },
];

export const getRooms = (hotelId: number): Room[] => [
  {
    id: 1,
    hotelId,
    type: "Standard Room",
    price: hotels.find(h => h.id === hotelId)?.pricePerNight || 100,
    capacity: 2,
    available: true,
    amenities: ["King Bed", "Wi-Fi", "TV", "Mini Bar"],
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
  },
  {
    id: 2,
    hotelId,
    type: "Deluxe Suite",
    price: Math.round((hotels.find(h => h.id === hotelId)?.pricePerNight || 100) * 1.6),
    capacity: 2,
    available: true,
    amenities: ["King Bed", "Living Area", "Wi-Fi", "TV", "Mini Bar", "Balcony"],
    image: "https://images.unsplash.com/photo-1590490360182-c33d955f4e24?w=600&q=80",
  },
  {
    id: 3,
    hotelId,
    type: "Family Room",
    price: Math.round((hotels.find(h => h.id === hotelId)?.pricePerNight || 100) * 1.3),
    capacity: 4,
    available: true,
    amenities: ["2 Queen Beds", "Wi-Fi", "TV", "Mini Bar", "Extra Space"],
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80",
  },
  {
    id: 4,
    hotelId,
    type: "Presidential Suite",
    price: Math.round((hotels.find(h => h.id === hotelId)?.pricePerNight || 100) * 3),
    capacity: 2,
    available: false,
    amenities: ["King Bed", "Living Room", "Dining Area", "Butler Service", "Jacuzzi", "Panoramic View"],
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
  },
];

export const cities = ["Dubai", "Istanbul", "Riyadh", "Marrakech", "Casablanca", "Amman"];
