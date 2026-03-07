import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, MapPin, Calendar, Users, Shield, Zap, CheckCircle, ArrowLeft, ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { useI18n } from "@/lib/i18n";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Index = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const { t, lang } = useI18n();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  const [hotels, setHotels] = useState<any[]>([]);
  const [allHotels, setAllHotels] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      // Load active hotels with cover images for the hero section
      const { data: featuredData } = await supabase
        .from("hotels")
        .select("*")
        .eq("is_active", true)
        .not("cover_image", "is", null)
        .order("created_at", { ascending: false })
        .limit(6);
      
      // Load all active hotels for cities dropdown
      const { data: allData } = await supabase
        .from("hotels")
        .select("city")
        .eq("is_active", true);

      if (featuredData) setHotels(featuredData);
      if (allData) setCities([...new Set(allData.map((h: any) => h.city))]);
    };
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/hotels${city ? `?city=${city}` : ""}`);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-10 w-72 h-72 bg-secondary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <motion.div className="max-w-2xl mx-auto text-center space-y-6" initial="hidden" animate="visible">
            <motion.h1 variants={fadeUp} custom={0} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-accent leading-tight">
              {t("hero.title")}{" "}<span className="text-primary">Naity</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-muted-foreground max-w-lg mx-auto">
              {t("hero.subtitle")}
            </motion.p>

            <motion.form variants={fadeUp} custom={2} onSubmit={handleSearch} className="bg-card rounded-2xl p-3 shadow-elevated flex flex-col md:flex-row gap-3 max-w-xl mx-auto">
              <div className="flex items-center gap-2 flex-1 px-3 bg-muted rounded-xl">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-transparent py-3 text-sm outline-none text-foreground">
                  <option value="">{t("hero.anyCity")}</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 px-3 bg-muted rounded-xl">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <input type="date" className="bg-transparent py-3 text-sm outline-none text-foreground" />
              </div>
              <div className="flex items-center gap-2 px-3 bg-muted rounded-xl">
                <Users className="w-4 h-4 text-primary shrink-0" />
                <select className="bg-transparent py-3 text-sm outline-none text-foreground">
                  <option>{t("hero.guest1")}</option>
                  <option>{t("hero.guest2")}</option>
                  <option>{t("hero.guest3")}</option>
                  <option>{t("hero.guest4")}</option>
                </select>
              </div>
              <button type="submit" className="gradient-cta text-primary-foreground px-6 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shrink-0">
                <Search className="w-4 h-4" />
                {t("hero.search")}
              </button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* Direct connection */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4" />
              {t("direct.badge")}
            </div>
            <h2 className="text-3xl font-bold text-foreground">{t("direct.title")}</h2>
            <p className="text-muted-foreground">{t("direct.desc")}</p>
          </motion.div>
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">{t("featured.title")}</h2>
            <button onClick={() => navigate("/hotels")} className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              {t("featured.viewAll")} <Arrow className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.slice(0, 3).map((hotel, i) => {
              const name = lang === "ar" ? hotel.name_ar : hotel.name_en;
              return (
                <motion.div key={hotel.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Link to={`/hotels/${hotel.id}`} className="group block rounded-xl overflow-hidden bg-card shadow-card border border-border/50 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                    <div className="relative h-48 overflow-hidden">
                      <img src={hotel.cover_image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">{t("benefits.title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: t("benefits.realtime.title"), desc: t("benefits.realtime.desc") },
              { icon: CheckCircle, title: t("benefits.instant.title"), desc: t("benefits.instant.desc") },
              { icon: Shield, title: t("benefits.secure.title"), desc: t("benefits.secure.desc") },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card rounded-xl p-6 shadow-card border border-border/50 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto">
                  <item.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Download App CTA */}
      <section className="py-16 bg-accent">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-xl mx-auto space-y-5">
            <h2 className="text-2xl font-bold text-accent-foreground">{t("app.download")}</h2>
            <div className="flex items-center justify-center gap-4">
              <a href="#" className="inline-flex items-center gap-2.5 bg-accent-foreground text-accent px-5 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                App Store
              </a>
              <a href="#" className="inline-flex items-center gap-2.5 bg-accent-foreground text-accent px-5 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M3.18 23.71c.46.27 1.03.3 1.52.1l12.13-6.97-3.04-3.04-10.61 9.91zM.53 1.33C.2 1.7 0 2.24 0 2.91v18.18c0 .67.2 1.21.53 1.58l.08.08 10.17-10.17v-.24L.61 1.25l-.08.08zM17.87 14.77l-3.4-3.4v-.24l3.4-3.4.08.04 4.02 2.28c1.15.65 1.15 1.72 0 2.37l-4.02 2.28-.08.07zM14.4 11.13L4.78.56c-.5-.27-1.12-.3-1.6-.1L14.4 11.13z"/></svg>
                Google Play
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
