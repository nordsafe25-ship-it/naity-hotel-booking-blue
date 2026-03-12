import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal, Star, MapPin, X, Map as MapIcon, List, ArrowUpDown, Wifi, Zap as ZapIcon,
  PlaneTakeoff, UtensilsCrossed, Dumbbell, Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

const HotelMapView = lazy(() => import("@/components/search/HotelMapView"));

import { SYRIAN_MAIN_CITIES, ALLOWED_CITY_NAMES } from "@/lib/cities";

const AMENITY_OPTIONS = [
  { key: "wifi", label_en: "High-speed Wi-Fi", label_ar: "واي فاي عالي السرعة", icon: Wifi },
  { key: "electricity", label_en: "24/7 Electricity", label_ar: "كهرباء 24/7", icon: ZapIcon },
  { key: "shuttle", label_en: "Airport Shuttle", label_ar: "نقل من المطار", icon: PlaneTakeoff },
  { key: "breakfast", label_en: "Breakfast Included", label_ar: "إفطار مشمول", icon: UtensilsCrossed },
  { key: "gym", label_en: "Gym/Spa", label_ar: "صالة رياضية/سبا", icon: Dumbbell },
];

type SortOption = "recommended" | "price_low" | "price_high" | "top_rated";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const { t, lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;
  const isMobile = useIsMobile();

  const rawCity = searchParams.get("city") || "";
  const initialCity = (ALLOWED_CITY_NAMES as readonly string[]).includes(rawCity) ? rawCity : "";

  const [hotels, setHotels] = useState<any[]>([]);
  const [minPrices, setMinPrices] = useState<Record<string, number>>({});
  const [syncStatuses, setSyncStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [city, setCity] = useState(initialCity);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [starFilters, setStarFilters] = useState<number[]>([]);
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [instantOnly, setInstantOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<"all" | "hotel" | "apartment">("all");

  const hasActiveFilters = city !== "" || starFilters.length > 0 || amenityFilters.length > 0 || instantOnly || priceRange[0] > 0 || priceRange[1] < 500 || propertyTypeFilter !== "all";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
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

  const filtered = useMemo(() => {
    let result = hotels.filter((h) => {
      if (city && h.city !== city) return false;
      if (propertyTypeFilter !== "all" && (h as any).property_type !== propertyTypeFilter) return false;
      if (starFilters.length > 0 && !starFilters.includes(h.stars)) return false;
      if (instantOnly && !syncStatuses[h.id]) return false;
      const price = minPrices[h.id];
      if (price !== undefined) {
        if (price < priceRange[0] || price > priceRange[1]) return false;
      }
      if (amenityFilters.length > 0 && h.amenities) {
        const hotelAmenities = (h.amenities as string[]).map(a => a.toLowerCase());
        const hasAll = amenityFilters.every(af => hotelAmenities.some(ha => ha.includes(af)));
        if (!hasAll) return false;
      }
      return true;
    });

    switch (sortBy) {
      case "price_low":
        result.sort((a, b) => (minPrices[a.id] || 9999) - (minPrices[b.id] || 9999));
        break;
      case "price_high":
        result.sort((a, b) => (minPrices[b.id] || 0) - (minPrices[a.id] || 0));
        break;
      case "top_rated":
        result.sort((a, b) => b.stars - a.stars);
        break;
      default:
        result.sort((a, b) => {
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
          return b.stars - a.stars;
        });
    }
    return result;
  }, [hotels, city, propertyTypeFilter, starFilters, amenityFilters, instantOnly, priceRange, sortBy, minPrices, syncStatuses]);

  const clearAllFilters = () => {
    setCity("");
    setStarFilters([]);
    setAmenityFilters([]);
    setInstantOnly(false);
    setPriceRange([0, 500]);
    setSortBy("recommended");
    setPropertyTypeFilter("all");
  };

  const toggleStar = (s: number) => {
    setStarFilters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleAmenity = (a: string) => {
    setAmenityFilters(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Property Type */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">{tx("نوع العقار", "Property Type")}</label>
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
        <label className="text-sm font-semibold text-foreground">{tx("المدينة", "City")}</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground border border-border/50"
        >
          <option value="">{tx("جميع المدن", "All Cities")}</option>
          {SYRIAN_MAIN_CITIES.map((c) => (
            <option key={c.en} value={c.en}>{lang === "ar" ? c.ar : c.en}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">{tx("نطاق السعر", "Price Range")}</label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={500}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground" dir="ltr">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>

      {/* Star Rating */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">{tx("تصنيف النجوم", "Star Rating")}</label>
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={starFilters.includes(s)}
                onCheckedChange={() => toggleStar(s)}
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
        <label className="text-sm font-semibold text-foreground">{tx("المرافق", "Amenities")}</label>
        <div className="flex flex-col gap-2">
          {AMENITY_OPTIONS.map((a) => (
            <label key={a.key} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={amenityFilters.includes(a.key)}
                onCheckedChange={() => toggleAmenity(a.key)}
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
          <p className="text-xs text-muted-foreground">{tx("إظهار الفنادق المتصلة فقط", "Only show connected hotels")}</p>
        </div>
        <Switch checked={instantOnly} onCheckedChange={setInstantOnly} />
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearAllFilters} className="w-full gap-2">
          <X className="w-3.5 h-3.5" />
          {tx("مسح جميع الفلاتر", "Clear All Filters")}
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header with sort & view toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl md:text-3xl font-extrabold text-accent">
              {tx("نتائج البحث", "Search Results")}
            </motion.h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} {tx("فندق", "hotel")}{filtered.length !== 1 ? tx("", "s") : ""} {tx("تم العثور عليه", "found")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-44 bg-card border-border/50">
                <ArrowUpDown className="w-3.5 h-3.5 me-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">{tx("الأفضل", "Recommended")}</SelectItem>
                <SelectItem value="price_low">{tx("السعر: الأقل", "Price: Low → High")}</SelectItem>
                <SelectItem value="price_high">{tx("السعر: الأعلى", "Price: High → Low")}</SelectItem>
                <SelectItem value="top_rated">{tx("الأعلى تقييماً", "Top Rated")}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition ${viewMode === "list" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-2 rounded-md transition ${viewMode === "map" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          {!isMobile && (
            <motion.aside
              initial={{ opacity: 0, x: lang === "ar" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-72 shrink-0 bg-card rounded-xl p-5 shadow-card border border-border/50 h-fit sticky top-24"
            >
              <div className="flex items-center gap-2 text-foreground font-semibold mb-5">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                {tx("الفلاتر", "Filters")}
                {hasActiveFilters && (
                  <span className="ms-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {tx("نشطة", "Active")}
                  </span>
                )}
              </div>
              <FilterContent />
            </motion.aside>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {viewMode === "map" ? (
              <Suspense fallback={<div className="h-[500px] rounded-xl bg-muted animate-pulse" />}>
                <HotelMapView hotels={filtered} minPrices={minPrices} lang={lang} />
              </Suspense>
            ) : loading ? (
              <div className="text-center py-20 text-muted-foreground">{tx("جاري التحميل...", "Loading...")}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground mb-4">{tx("لا توجد نتائج", "No results found")}</p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters} className="gap-2">
                    <X className="w-3.5 h-3.5" />
                    {tx("مسح الفلاتر", "Clear Filters")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence mode="popLayout">
                  {filtered.map((hotel, i) => {
                    const name = lang === "ar" ? hotel.name_ar : hotel.name_en;
                    const price = minPrices[hotel.id];
                    const isOnline = syncStatuses[hotel.id];
                    const isApartment = (hotel as any).property_type === "apartment";
                    return (
                      <motion.div
                        key={hotel.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.03, duration: 0.3 }}
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
                              <div className="absolute top-3 start-3 bg-card/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-primary" dir="ltr">
                                ${price}<span className="font-normal text-muted-foreground">/night</span>
                              </div>
                            )}
                            {isOnline && (
                              <div className="absolute top-3 end-3 bg-emerald-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-white flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                {tx("متصل", "Live")}
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
                            {hotel.amenities && hotel.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {(hotel.amenities as string[]).slice(0, 3).map((a) => (
                                  <span key={a} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{a}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter FAB */}
      {isMobile && (
        <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <SheetTrigger asChild>
            <button className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 gradient-cta text-primary-foreground px-6 py-3 rounded-full shadow-elevated flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal className="w-4 h-4" />
              {tx("الفلاتر", "Filters")}
              {hasActiveFilters && (
                <span className="bg-primary-foreground/20 text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">!</span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="text-start">{tx("الفلاتر", "Filters")}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </Layout>
  );
};

export default SearchResults;
