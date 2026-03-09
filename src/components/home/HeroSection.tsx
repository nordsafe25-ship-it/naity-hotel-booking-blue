import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Calendar, Users, Minus, Plus, Shield, Zap, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";

const SYRIAN_CITIES = [
  { en: "Damascus", ar: "دمشق" },
  { en: "Aleppo", ar: "حلب" },
  { en: "Lattakia", ar: "اللاذقية" },
  { en: "Homs", ar: "حمص" },
  { en: "Tartus", ar: "طرطوس" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const HeroSection = () => {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;

  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (checkIn) params.set("checkIn", format(checkIn, "yyyy-MM-dd"));
    if (checkOut) params.set("checkOut", format(checkOut, "yyyy-MM-dd"));
    params.set("adults", String(adults));
    if (children > 0) params.set("children", String(children));
    navigate(`/search?${params.toString()}`);
  };

  const trustBadges = [
    { icon: Shield, text: tx("ادفع 10% فقط — الباقي عند الوصول", "Pay Only 10% — Rest on Arrival") },
    { icon: Zap,    text: tx("تأكيد فوري مباشر من الفندق",       "Instant Direct Hotel Confirmation") },
    { icon: Mail,   text: tx("تتبع حجزك بالبريد — بدون حساب",    "Track by Email — No Account Needed") },
  ];

  return (
    <section className="relative overflow-hidden gradient-hero">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 right-10 w-72 h-72 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 py-20 md:py-28 relative">
        <motion.div className="max-w-3xl mx-auto text-center space-y-6" initial="hidden" animate="visible">
          {/* Badge */}
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold">
            {tx("حجز مباشر · بدون وسيط · بدون حساب", "Direct Booking · No Middleman · No Account")}
          </motion.div>

          {/* Title */}
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-accent leading-tight">
            {tx("اعثر على إقامتك المثالية مع", "Find your perfect stay with")}{" "}
            <span className="text-primary">Naity</span>
          </motion.h1>

          {/* Slogan */}
          <motion.p variants={fadeUp} custom={2} className="text-sm font-medium text-primary/80">
            {tx("نيتي — نحن نجهّز إقامتك", "Naity — We Prepare Your Stay")}
          </motion.p>

          {/* Subtitle */}
          <motion.p variants={fadeUp} custom={3} className="text-lg text-muted-foreground max-w-lg mx-auto">
            {tx("حجز مباشر. ادفع 10% الآن والباقي 90% نقداً عند وصولك.",
                "Book direct. Pay 10% now, 90% cash on arrival.")}
          </motion.p>

          {/* Search Bar */}
          <motion.form variants={fadeUp} custom={4} onSubmit={handleSearch} className="bg-card rounded-2xl p-4 shadow-elevated max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* City */}
              <div className="flex items-center gap-2 px-3 bg-muted rounded-xl">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-transparent py-3 text-sm outline-none text-foreground">
                  <option value="">{tx("أي مدينة", "Any City")}</option>
                  {SYRIAN_CITIES.map((c) => (
                    <option key={c.en} value={c.en}>{lang === "ar" ? c.ar : c.en}</option>
                  ))}
                </select>
              </div>

              {/* Check-in */}
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className={cn("flex items-center gap-2 px-3 bg-muted rounded-xl py-3 text-sm text-start w-full", !checkIn && "text-muted-foreground")}>
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    {checkIn ? format(checkIn, "dd/MM/yyyy") : tx("تاريخ الوصول", "Check-in")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI mode="single" selected={checkIn} onSelect={setCheckIn} disabled={(d) => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>

              {/* Check-out */}
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className={cn("flex items-center gap-2 px-3 bg-muted rounded-xl py-3 text-sm text-start w-full", !checkOut && "text-muted-foreground")}>
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    {checkOut ? format(checkOut, "dd/MM/yyyy") : tx("تاريخ المغادرة", "Check-out")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI mode="single" selected={checkOut} onSelect={setCheckOut} disabled={(d) => d < (checkIn || new Date())} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>

              {/* Guests */}
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="flex items-center gap-2 px-3 bg-muted rounded-xl py-3 text-sm w-full">
                    <Users className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground">{adults} {tx("بالغ", "Adult")}{adults > 1 ? tx("ين", "s") : ""}{children > 0 ? `, ${children} ${tx("طفل", "Child")}` : ""}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 space-y-4" align="start">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{tx("بالغين", "Adults")}</span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="text-sm font-semibold w-4 text-center">{adults}</span>
                      <button type="button" onClick={() => setAdults(Math.min(10, adults + 1))} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{tx("أطفال", "Children")}</span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="text-sm font-semibold w-4 text-center">{children}</span>
                      <button type="button" onClick={() => setChildren(Math.min(6, children + 1))} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <button type="submit" className="w-full mt-3 gradient-cta text-primary-foreground px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <Search className="w-4 h-4" />
              {tx("ابحث عن فندق", "Search Hotels")}
            </button>
          </motion.form>

          {/* Popular destinations quick links */}
          <motion.div variants={fadeUp} custom={5} className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground">{tx("وجهات شائعة:", "Popular:")}</span>
            {SYRIAN_CITIES.slice(0, 4).map((c) => (
              <button key={c.en} onClick={() => { setCity(c.en); navigate(`/search?city=${c.en}`); }}
                className="text-xs bg-card/80 backdrop-blur-sm border border-border/50 text-foreground px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all">
                {lang === "ar" ? c.ar : c.en}
              </button>
            ))}
          </motion.div>

          {/* Trust indicators */}
          <motion.div variants={fadeUp} custom={6} className="flex flex-wrap items-center justify-center gap-4 md:gap-6 pt-4">
            {trustBadges.map((badge, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <badge.icon className="w-3.5 h-3.5 text-primary" />
                <span>{badge.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
