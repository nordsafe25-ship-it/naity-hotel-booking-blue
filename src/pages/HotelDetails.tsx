import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MapPin, Users, Check, X } from "lucide-react";
import { hotels, getRooms } from "@/lib/mockData";
import Layout from "@/components/Layout";
import { useI18n, useLocalizedHotelData } from "@/lib/i18n";

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const hotel = hotels.find((h) => h.id === Number(id));
  const rooms = hotel ? getRooms(hotel.id) : [];
  const { t } = useI18n();
  const { localizeHotelName, localizeHotelDesc, localizeAmenity, localizeCity, localizeRoomType, localizeRoomAmenity } = useLocalizedHotelData();

  if (!hotel) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("hotel.notFound")}</h1>
        </div>
      </Layout>
    );
  }

  const name = localizeHotelName(hotel.id, hotel.name);

  return (
    <Layout>
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img src={hotel.image} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-accent/80 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: hotel.stars }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-accent-foreground">{name}</h1>
            <div className="flex items-center gap-2 text-accent-foreground/80 mt-1">
              <MapPin className="w-4 h-4" /> {localizeCity(hotel.city)}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-10">
        <div className="flex flex-wrap gap-4">
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-lg">
            {hotel.rating} / 5
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            {hotel.reviewCount} {t("hotel.reviews")}
          </div>
          <div className="ms-auto text-2xl font-bold text-foreground" dir="ltr">
            From ${hotel.pricePerNight}
            <span className="text-sm font-normal text-muted-foreground">{t("hotel.perNight")}</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">{t("hotel.about")}</h2>
          <p className="text-muted-foreground leading-relaxed">{localizeHotelDesc(hotel.id, hotel.description)}</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">{t("hotel.amenities")}</h2>
          <div className="flex flex-wrap gap-2">
            {hotel.amenities.map((a) => (
              <span key={a} className="bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-primary" /> {localizeAmenity(a)}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">{t("hotel.rooms")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl overflow-hidden shadow-card border border-border/50"
              >
                <img src={room.image} alt={localizeRoomType(room.type)} className="w-full h-40 object-cover" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{localizeRoomType(room.type)}</h3>
                    {room.available ? (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">{t("hotel.available")}</span>
                    ) : (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-md font-medium flex items-center gap-1">
                        <X className="w-3 h-3" /> {t("hotel.soldOut")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" /> {t("hotel.upTo")} {room.capacity} {t("hotel.guests")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {room.amenities.map((a) => (
                      <span key={a} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        {localizeRoomAmenity(a)}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-lg font-bold text-foreground" dir="ltr">${room.price}<span className="text-sm font-normal text-muted-foreground">{t("hotel.perNight")}</span></span>
                    <button
                      disabled={!room.available}
                      onClick={() => navigate(`/booking?hotel=${hotel.id}&room=${room.id}`)}
                      className="gradient-cta text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t("hotel.bookNow")}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HotelDetails;
