import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Calendar, Users, Shield, Zap, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { hotels, cities } from "@/lib/mockData";
import HotelCard from "@/components/HotelCard";
import Layout from "@/components/Layout";
import { useI18n, useLocalizedHotelData } from "@/lib/i18n";

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
  const { localizeCity } = useLocalizedHotelData();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

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
          <motion.div
            className="max-w-2xl mx-auto text-center space-y-6"
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              variants={fadeUp}
              custom={0}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-accent leading-tight"
            >
              {t("hero.title")}{" "}
              <span className="text-primary">Naity</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-lg text-muted-foreground max-w-lg mx-auto"
            >
              {t("hero.subtitle")}
            </motion.p>

            {/* Search */}
            <motion.form
              variants={fadeUp}
              custom={2}
              onSubmit={handleSearch}
              className="bg-card rounded-2xl p-3 shadow-elevated flex flex-col md:flex-row gap-3 max-w-xl mx-auto"
            >
              <div className="flex items-center gap-2 flex-1 px-3 bg-muted rounded-xl">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-transparent py-3 text-sm outline-none text-foreground"
                >
                  <option value="">{t("hero.anyCity")}</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{localizeCity(c)}</option>
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
              <button
                type="submit"
                className="gradient-cta text-primary-foreground px-6 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shrink-0"
              >
                <Search className="w-4 h-4" />
                {t("hero.search")}
              </button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* Hajiz connection */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto space-y-4"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4" />
              {t("hajiz.badge")}
            </div>
            <h2 className="text-3xl font-bold text-foreground">{t("hajiz.title")}</h2>
            <p className="text-muted-foreground">{t("hajiz.desc")}</p>
          </motion.div>
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">{t("featured.title")}</h2>
            <button
              onClick={() => navigate("/hotels")}
              className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              {t("featured.viewAll")} <Arrow className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.slice(0, 3).map((hotel, i) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <HotelCard hotel={hotel} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            {t("benefits.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: t("benefits.realtime.title"), desc: t("benefits.realtime.desc") },
              { icon: CheckCircle, title: t("benefits.instant.title"), desc: t("benefits.instant.desc") },
              { icon: Shield, title: t("benefits.secure.title"), desc: t("benefits.secure.desc") },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl p-6 shadow-card border border-border/50 text-center space-y-3"
              >
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
    </Layout>
  );
};

export default Index;
