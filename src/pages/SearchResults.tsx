import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MapPin, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { useI18n } from "@/lib/i18n";

type SortOption = "recommended" | "price_low" | "price_high";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const { lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;

  const [hotels, setHotels] = useState<any[]>([]);
  const [minPrices, setMinPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");

  const city = searchParams.get("city") || "";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [hotelsRes, roomsRes] = await Promise.all([
        supabase.from("hotels").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("room_categories").select("hotel_id, price_per_night").eq("is_active", true),
      ]);

      if (hotelsRes.data) setHotels(hotelsRes.data);
      if (roomsRes.data) {
        const prices: Record<string, number> = {};
        roomsRes.data.forEach((r: any) => {
          if (!prices[r.hotel_id] || r.price_per_night < prices[r.hotel_id]) {
            prices[r.hotel_id] = r.price_per_night;
          }
        });
        setMinPrices(prices);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = [...hotels];
    if (city) result = result.filter(h => h.city === city);

    if (sortBy === "price_low") {
      result.sort((a, b) => (minPrices[a.id] || 0) - (minPrices[b.id] || 0));
    } else if (sortBy === "price_high") {
      result.sort((a, b) => (minPrices[b.id] || 0) - (minPrices[a.id] || 0));
    }
    return result;
  }, [hotels, city, sortBy, minPrices]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {tx("نتائج البحث", "Search Results")}
            {city && <span className="text-primary ms-2">— {city}</span>}
          </h1>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground"
          >
            <option value="recommended">{tx("الافتراضي", "Default")}</option>
            <option value="price_low">{tx("السعر: الأقل", "Price: Low")}</option>
            <option value="price_high">{tx("السعر: الأعلى", "Price: High")}</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-muted-foreground text-lg">{tx("لا توجد نتائج", "No results found")}</p>
            <p className="text-sm text-muted-foreground">{tx("جرب البحث في مدينة أخرى", "Try searching in a different city")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((hotel, i) => {
              const name = lang === "ar" ? hotel.name_ar : hotel.name_en;
              const price = minPrices[hotel.id];
              return (
                <motion.div key={hotel.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link
                    to={`/hotels/${hotel.id}`}
                    className="group block rounded-xl overflow-hidden bg-card shadow-card border border-border/50 [@media(hover:hover)]:hover:shadow-elevated transition-all duration-300 [@media(hover:hover)]:hover:-translate-y-1 touch-action-manipulation"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={hotel.cover_image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
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
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchResults;
