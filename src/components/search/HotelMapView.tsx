import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Syrian city coordinates fallback
const CITY_COORDS: Record<string, [number, number]> = {
  Damascus: [33.5138, 36.2765],
  Aleppo: [36.2021, 37.1343],
  Lattakia: [35.5317, 35.7900],
  Homs: [34.7324, 36.7137],
  Tartus: [34.8890, 35.8866],
};

interface Props {
  hotels: any[];
  minPrices: Record<string, number>;
  lang: "ar" | "en";
}

const HotelMapView = ({ hotels, minPrices, lang }: Props) => {
  const center: [number, number] = hotels.length > 0
    ? (() => {
        const h = hotels[0];
        if (h.latitude && h.longitude) return [h.latitude, h.longitude];
        return CITY_COORDS[h.city] || [34.8, 36.5];
      })()
    : [34.8, 36.5];

  return (
    <div className="h-[500px] md:h-[600px] rounded-xl overflow-hidden border border-border/50 shadow-card">
      {/* @ts-ignore - react-leaflet v5 typing issue */}
      <MapContainer center={center as any} zoom={7} className="h-full w-full" scrollWheelZoom={true as any}>
        {/* @ts-ignore */}
        <TileLayer
          {...{ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' } as any}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hotels.map((hotel) => {
          const pos: [number, number] = hotel.latitude && hotel.longitude
            ? [hotel.latitude, hotel.longitude]
            : CITY_COORDS[hotel.city] || [34.8, 36.5];
          const name = lang === "ar" ? hotel.name_ar : hotel.name_en;
          const price = minPrices[hotel.id];

          return (
            // @ts-ignore
            <Marker key={hotel.id} position={pos as any}>
              <Popup>
                <div className="min-w-[180px] space-y-2">
                  {hotel.cover_image && (
                    <img src={hotel.cover_image} alt={name} className="w-full h-24 object-cover rounded" />
                  )}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: hotel.stars }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="font-semibold text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {hotel.city}
                  </p>
                  {price && <p className="text-xs font-bold text-primary">${price}/night</p>}
                  <Link
                    to={`/hotels/${hotel.id}`}
                    className="block text-center text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition"
                  >
                    {lang === "ar" ? "عرض التفاصيل" : "View Details"}
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default HotelMapView;
