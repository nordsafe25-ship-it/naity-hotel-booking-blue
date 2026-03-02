import { Hotel } from "@/lib/mockData";
import { Star, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const HotelCard = ({ hotel }: { hotel: Hotel }) => (
  <Link
    to={`/hotels/${hotel.id}`}
    className="group block rounded-xl overflow-hidden bg-card shadow-card border border-border/50 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
  >
    <div className="relative h-48 overflow-hidden">
      <img
        src={hotel.image}
        alt={hotel.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-primary">
        ${hotel.pricePerNight}/night
      </div>
    </div>
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: hotel.stars }).map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
        ))}
      </div>
      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
        {hotel.name}
      </h3>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="w-3.5 h-3.5" />
        {hotel.city}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
          {hotel.rating}
        </span>
        <span className="text-muted-foreground">{hotel.reviewCount} reviews</span>
      </div>
    </div>
  </Link>
);

export default HotelCard;
