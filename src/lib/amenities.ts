import { Wifi, UtensilsCrossed, Zap, Droplets, Car, Waves, Thermometer } from "lucide-react";

export const STRUCTURED_AMENITIES = [
  { key: "amenity_wifi", icon: Wifi, label_en: "WiFi", label_ar: "واي فاي" },
  { key: "amenity_breakfast", icon: UtensilsCrossed, label_en: "Breakfast Included", label_ar: "فطور مشمول" },
  { key: "amenity_electricity_24h", icon: Zap, label_en: "24h Electricity", label_ar: "كهرباء 24 ساعة" },
  { key: "amenity_hot_water_24h", icon: Droplets, label_en: "24h Hot Water", label_ar: "مياه ساخنة 24 ساعة" },
  { key: "amenity_parking", icon: Car, label_en: "Parking", label_ar: "كراج / موقف" },
  { key: "amenity_pool", icon: Waves, label_en: "Swimming Pool", label_ar: "مسبح" },
  { key: "amenity_ac_heating", icon: Thermometer, label_en: "AC & Heating", label_ar: "مكيف وتدفئة" },
] as const;

export type AmenityKey = typeof STRUCTURED_AMENITIES[number]["key"];
