import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MapPin, ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

const FeaturedHotels = () => {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  const [hotels, setHotels] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("hotels")
        .select("*")
        .eq("is_active", true)
        .not("cover_image", "is", null)
        .order("created_at", { ascending: false })
        .limit(6);
      if (data) {
        setHotels(data);
        // fetch min prices
        const { data: rooms } = await supabase
          .from("room_categories")
          .select("hotel_id, price_per_night")
          .eq("is_active", true)
          .in("hotel_id", data.map(h => h.id));
        if (rooms) {
          const map: Record<string, number> = {};
          rooms.forEach(r => {
            if (!map[r.hotel_id] || r.price_per_night < map[r.hotel_id]) {
              map[r.hotel_id] = r.price_per_night;
            }
          });
          setPrices(map);
        }
      }
    };
    load();
  }, []);

  if (hotels.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{tx("فنادق مميزة", "Featured Hotels")}</h2>
            <p className="text-muted-foreground text-sm mt-1">{tx("أفضل الفنادق المتاحة للحجز الفوري", "Top hotels available for instant booking")}</p>
          </div>
          <button onClick={() => navigate("/search")} className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            {tx("عرض الكل", "View All")} <Arrow className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel, i) => {
            const name = lang === "ar" ? hotel.name_ar : hotel.name_en;
            const price = prices[hotel.id];
            return (
              <motion.div key={hotel.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link to={`/hotels/${hotel.id}`} className="group block rounded-2xl overflow-hidden bg-card shadow-card border border-border/50 [@media(hover:hover)]:hover:shadow-elevated transition-all duration-300 [@media(hover:hover)]:hover:-translate-y-1 touch-action-manipulation">
                  <div className="relative h-52 overflow-hidden">
                    <img src={hotel.cover_image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    {price && (
                      <div className="absolute top-3 start-3 bg-card/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-primary" dir="ltr">
                        ${price}<span className="text-muted-foreground font-normal">/{tx("ليلة", "night")}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: hotel.stars }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {hotel.city}
                    </div>
                    <div className="pt-2">
                      <span className="text-xs font-medium gradient-cta text-primary-foreground px-3 py-1.5 rounded-lg inline-block group-hover:opacity-90 transition">
                        {tx("احجز الآن", "Book Now")}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedHotels;
