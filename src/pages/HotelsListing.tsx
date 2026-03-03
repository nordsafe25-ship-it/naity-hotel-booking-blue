import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { hotels, cities } from "@/lib/mockData";
import HotelCard from "@/components/HotelCard";
import Layout from "@/components/Layout";
import { useI18n, useLocalizedHotelData } from "@/lib/i18n";

const HotelsListing = () => {
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [minStars, setMinStars] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);
  const { t } = useI18n();
  const { localizeCity } = useLocalizedHotelData();

  const filtered = useMemo(
    () =>
      hotels.filter(
        (h) =>
          (!city || h.city === city) &&
          h.stars >= minStars &&
          h.pricePerNight <= maxPrice
      ),
    [city, minStars, maxPrice]
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold text-accent mb-8"
        >
          {t("hotels.title")}
        </motion.h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 shrink-0 bg-card rounded-xl p-5 shadow-card border border-border/50 h-fit space-y-5"
          >
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              {t("hotels.filter")}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("hotels.city")}</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none text-foreground"
              >
                <option value="">{t("hotels.allCities")}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{localizeCity(c)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("hotels.minStars")}</label>
              <select
                value={minStars}
                onChange={(e) => setMinStars(Number(e.target.value))}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none text-foreground"
              >
                <option value={0}>{t("hotels.all")}</option>
                {[3, 4, 5].map((s) => (
                  <option key={s} value={s}>{s}+ {t("hotels.stars")}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("hotels.maxPrice")}: <span dir="ltr">${maxPrice}</span>
              </label>
              <input
                type="range"
                min={50}
                max={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </motion.aside>

          <div className="flex-1">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-20">{t("hotels.noResults")}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((hotel, i) => (
                  <motion.div
                    key={hotel.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <HotelCard hotel={hotel} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HotelsListing;
