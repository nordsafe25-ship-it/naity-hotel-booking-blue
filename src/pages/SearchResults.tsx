import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal, Star, MapPin, X, Map as MapIcon, List, ArrowUpDown
} from "lucide-react";

import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const HotelMapView = lazy(() => import("@/components/search/HotelMapView"));

type SortOption = "recommended" | "price_low" | "price_high";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const { lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;
  const isMobile = useIsMobile();

  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const [sortBy, setSortBy] = useState<SortOption>("recommended");

  const city = searchParams.get("city") || "";

  // ✅ تحميل البيانات من API
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const res = await fetch("https://backend.naity.net/hotels.php");
        const data = await res.json();

        console.log("API DATA:", data);

        setHotels(data);

      } catch (error) {
        console.error(error);
        toast.error("خطأ بالاتصال");
      }

      setLoading(false);
    };

    load();
  }, []);

  // ✅ فلترة + ترتيب
  const filtered = useMemo(() => {
    let result = hotels;

    if (city) {
      result = result.filter(h => h.city === city);
    }

    if (sortBy === "price_low") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sortBy === "price_high") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [hotels, city, sortBy]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {tx("نتائج البحث", "Search Results")}
          </h1>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="border rounded px-2 py-1"
          >
            <option value="recommended">Default</option>
            <option value="price_low">Price Low</option>
            <option value="price_high">Price High</option>
          </select>
        </div>

        {/* Loading */}
        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <p>No results</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((hotel) => (
              <div key={hotel.id} className="border rounded-xl p-4 shadow">

                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"
                  className="rounded-lg mb-3"
                />

                <h2 className="font-bold text-lg">{hotel.name}</h2>

                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin size={14} /> {hotel.city}
                </p>

                <p className="text-primary font-bold mt-2">
                  ${hotel.price}
                </p>

              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchResults;
