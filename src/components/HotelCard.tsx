import { Hotel } from "@/lib/mockData";
import { Star, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n, useLocalizedHotelData } from "@/lib/i18n";

const HotelCard = ({ hotel }: { hotel: Hotel & { property_type?: string } }) => {
  const { t, lang } = useI18n();
  const { localizeHotelName, localizeCity } = useLocalizedHotelData();

  return (
    <Link
      to={`/hotels/${hotel.id}`}
      className="group block rounded-xl overflow-hidden bg-card shadow-card border border-border/50 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={hotel.image}
          alt={localizeHotelName(hotel.id, hotel.name)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-primary" dir="ltr">
          ${hotel.pricePerNight}{t("hotel.perNight")}
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: hotel.stars }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
          ))}
        </div>
        {(hotel as any).property_type === "apartment" && (
          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            🏠 {lang === "ar" ? "شقة" : "Apt"}
          </span>
        )}
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {localizeHotelName(hotel.id, hotel.name)}
        </h3>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          {localizeCity(hotel.city)}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
            {hotel.rating}
          </span>
          <span className="text-muted-foreground">{hotel.reviewCount} {t("card.review")}</span>
        </div>
      </div>
    </Link>
  );
};

export default HotelCard;
