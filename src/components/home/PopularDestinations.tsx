import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

import damascusImg from "@/assets/cities/damascus.jpg";
import aleppoImg from "@/assets/cities/aleppo.jpg";
import lattakiaImg from "@/assets/cities/lattakia.jpg";
import tartusImg from "@/assets/cities/tartus.jpg";
import homsImg from "@/assets/cities/homs.jpg";

const CITIES = [
  { en: "Damascus",  ar: "دمشق",      img: damascusImg },
  { en: "Aleppo",    ar: "حلب",       img: aleppoImg },
  { en: "Homs",      ar: "حمص",       img: homsImg },
  { en: "Lattakia",  ar: "اللاذقية",   img: lattakiaImg },
  { en: "Tartus",    ar: "طرطوس",     img: tartusImg },
];

const PopularDestinations = () => {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("hotels").select("city").eq("is_active", true);
      if (data) {
        const map: Record<string, number> = {};
        data.forEach((h) => { map[h.city] = (map[h.city] || 0) + 1; });
        setCounts(map);
      }
    };
    load();
  }, []);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{tx("وجهات شائعة", "Popular Destinations")}</h2>
          <p className="text-muted-foreground text-sm">{tx("اكتشف أجمل المدن السورية واحجز فندقك", "Explore Syria's most beautiful cities")}</p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CITIES.map((city, i) => (
            <motion.button key={city.en} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              onClick={() => navigate(`/search?city=${city.en}`)}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] text-start">
              <img src={city.img} alt={lang === "ar" ? city.ar : city.en} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-accent/80 via-accent/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-4 space-y-1">
                <h3 className="text-accent-foreground font-bold text-lg">{lang === "ar" ? city.ar : city.en}</h3>
                <div className="flex items-center gap-1 text-accent-foreground/80 text-xs">
                  <MapPin className="w-3 h-3" />
                  <span>{counts[city.en] || 0} {tx("فندق", "hotels")}</span>
                </div>
                <span className="inline-block mt-1 text-xs text-primary-foreground bg-primary/80 backdrop-blur-sm px-2.5 py-1 rounded-full group-hover:bg-primary transition">
                  {tx("استكشف الفنادق", "Explore Hotels")}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularDestinations;
