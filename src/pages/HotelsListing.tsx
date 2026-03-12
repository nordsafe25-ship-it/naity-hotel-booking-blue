import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, Star, MapPin, X, Wifi, Zap as ZapIcon, PlaneTakeoff, UtensilsCrossed, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { useI18n } from "@/lib/i18n";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

const SYRIAN_CITIES = [
  { en: "Damascus",  ar: "دمشق" },
  { en: "Aleppo",    ar: "حلب" },
  { en: "Homs",      ar: "حمص" },
  { en: "Hama",      ar: "حماة" },
  { en: "Lattakia",  ar: "اللاذقية" },
  { en: "Tartus",    ar: "طرطوس" },
];

const AMENITY_OPTIONS = [
  { key: "wifi", label_en: "High-speed Wi-Fi", label_ar: "واي فاي عالي السرعة", icon: Wifi },
  { key: "electricity", label_en: "24/7 Electricity", label_ar: "كهرباء 24/7", icon: ZapIcon },
  { key: "shuttle", label_en: "Airport Shuttle", label_ar: "نقل من المطار", icon: PlaneTakeoff },
  { key: "breakfast", label_en: "Breakfast Included", label_ar: "إفطار مشمول", icon: UtensilsCrossed },
  { key: "gym", label_en: "Gym/Spa", label_ar: "صالة رياضية/سبا", icon: Dumbbell },
];

const HotelsListing = () => {
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(searchParams.get("city") || "");
  const { t, lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;

  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [minPrices, setMinPrices] = useState<Record<string, number>>({});
  const [syncStatuses, setSyncStatuses] = useState<Record<string, boolean>>({});

  // Filters
  const [starFilters, setStarFilters] = useState<number[]>([]);
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [instantOnly, setInstantOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<"all" | "hotel" | "apartment">("all");

  const hasActiveFilters = city !== "" || starFilters.length > 0 || amenityFilters.length > 0 || instantOnly || priceRange[0] > 0 || priceRange[1] < 500 || propertyTypeFilter !== "all";

  const ALLOWED_CITY_NAMES = SYRIAN_CITIES.map(c => c.en);

  useEffect(() => {
    const load = async () => {
      const [hotelsRes, roomsRes, syncRes] = await Promise.all([
        supabase.from("hotels").select("*").eq("is_active", true).in("city", ALLOWED_CITY_NAMES).order("created_at", { ascending: false }),
        supabase.from("room_categories").select("hotel_id, price_per_night").eq("is_active", true),
        supabase.from("local_sync_settings").select("hotel_id, is_active, last_heartbeat_at"),
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
      if (syncRes.data) {
        const statuses: Record<string, boolean> = {};
        syncRes.data.forEach((s: any) => {
          if (s.is_active && s.last_heartbeat_at) {
            const diff = Date.now() - new Date(s.last_heartbeat_at).getTime();
            statuses[s.hotel_id] = diff < 5 * 60 * 1000;
          }
        });
        setSyncStatuses(statuses);
      }
      setLoading(false);
    };
    load();
  }, []);

  const clearAllFilters = () => {
    setCity("");
    setStarFilters([]);
    setAmenityFilters([]);
    setInstantOnly(false);
    setPriceRange([0, 500]);
    setPropertyTypeFilter("all");
  };

  const filtered = useMemo(() =>
    hotels.filter((h) => {
      if (city && h.city !== city) return false;
      if (propertyTypeFilter !== "all" && (h as any).property_type !== propertyTypeFilter) return false;
      if (starFilters.length > 0 && !starFilters.includes(h.stars)) return false;
      if (priceRange[0] > 0 || priceRange[1] < 500) {
        const p = minPrices[h.id];
        if (p !== undefined && (p < priceRange[0] || p > priceRange[1])) return false;
      }
      if (amenityFilters.length > 0 && h.amenities) {
        const ha = (h.amenities as string[]).map((a: string) => a.toLowerCase());
        if (!amenityFilters.every(af => ha.some(a => a.includes(af)))) return false;
      }
      if (instantOnly && !syncStatuses[h.id]) return false;
      return true;
    }),
    [hotels, city, propertyTypeFilter, starFilters, amenityFilters, instantOnly, priceRange, minPrices, syncStatuses]
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
          {/* Sidebar Filters */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-72 shrink-0 bg-card rounded-xl p-5 shadow-card border border-border/50 h-fit space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                {tx("الفلاتر", "Filters")}
              </div>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="text-xs text-primary flex items-center gap-1 hover:opacity-80">
                  <X className="w-3 h-3" /> {tx("مسح الكل", "Clear All")}
                </button>
              )}
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{tx("نوع العقار", "Property Type")}</label>
              <div className="flex flex-col gap-2">
                {[
                  { val: "all" as const, ar: "الكل", en: "All" },
                  { val: "hotel" as const, ar: "فندق", en: "Hotel" },
                  { val: "apartment" as const, ar: "شقة سياحية", en: "Apartment" },
                ].map(opt => (
                  <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="propertyType"
                      checked={propertyTypeFilter === opt.val}
                      onChange={() => setPropertyTypeFilter(opt.val)}
                      className="accent-primary w-4 h-4"
                    />
                    <span className="text-sm text-foreground">{lang === "ar" ? opt.ar : opt.en}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{tx("المدينة", "City")}</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground border border-border/50"
              >
                <option value="">{tx("جميع المدن", "All Cities")}</option>
                {SYRIAN_CITIES.map(c => (
                  <option key={c.en} value={c.en}>{lang === "ar" ? c.ar : c.en}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">{tx("نطاق السعر", "Price Range")}</label>
              <Slider
                value={priceRange}
                onValueChange={(v) => setPriceRange(v as [number, number])}
                min={0} max={500} step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground" dir="ltr">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">{tx("تصنيف النجوم", "Star Rating")}</label>
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={starFilters.includes(s)}
                      onCheckedChange={() => setStarFilters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                    />
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: s }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{s} {tx("نجوم", "Stars")}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">{tx("المرافق", "Amenities")}</label>
              <div className="flex flex-col gap-2">
                {AMENITY_OPTIONS.map(a => (
                  <label key={a.key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={amenityFilters.includes(a.key)}
                      onCheckedChange={() => setAmenityFilters(prev => prev.includes(a.key) ? prev.filter(x => x !== a.key) : [...prev, a.key])}
                    />
                    <a.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{lang === "ar" ? a.label_ar : a.label_en}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Instantly Bookable */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{tx("حجز فوري", "Instantly Bookable")}</p>
                <p className="text-xs text-muted-foreground">{tx("الفنادق المتصلة فقط", "Only connected hotels")}</p>
              </div>
              <Switch checked={instantOnly} onCheckedChange={setInstantOnly} />
            </div>
          </motion.aside>

          <div className="flex-1">
            {loading ? (
              <div className="text-center py-20 text-muted-foreground">{tx("جاري التحميل...", "Loading...")}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground mb-4">{t("hotels.noResults")}</p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters} className="gap-2">
                    <X className="w-3.5 h-3.5" />
                    {tx("مسح الفلاتر", "Clear Filters")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((hotel, i) => {
                  const name = lang === "ar" ? hotel.name_ar : hotel.name_en;
                  const price = minPrices[hotel.id];
                  const isApartment = (hotel as any).property_type === "apartment";
                  return (
                    <motion.div
                      key={hotel.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={`/hotels/${hotel.id}`}
                        className="group block rounded-xl overflow-hidden bg-card shadow-card border border-border/50 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={hotel.cover_image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"}
                            alt={name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {price && (
                            <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-primary" dir="ltr">
                              ${price}{t("hotel.perNight")}
                            </div>
                          )}
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: hotel.stars }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                              ))}
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isApartment ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                              {isApartment ? tx("🏠 شقة", "🏠 Apartment") : tx("🏨 فندق", "🏨 Hotel")}
                            </span>
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
        </div>
      </div>
    </Layout>
  );
};

export default HotelsListing;
