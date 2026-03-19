import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, Users, Check, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Calendar, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getRoomsByHotel } from "@/services";
import Layout from "@/components/Layout";
import { useI18n } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const DEPOSIT_PERCENT = 10;

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [hotel, setHotel] = useState<Tables<'hotels'> | null>(null);
  const [photos, setPhotos] = useState<Tables<'hotel_photos'>[]>([]);
  const [rooms, setRooms] = useState<Tables<'room_categories'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryIdx, setGalleryIdx] = useState(0);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDateBlocked, setIsDateBlocked] = useState(false);

  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const [hotelRes, photosRes, roomsRes] = await Promise.all([
        supabase.from("hotels").select("*").eq("id", id).eq("is_active", true).single(),
        supabase.from("hotel_photos").select("*").eq("hotel_id", id).order("sort_order"),
        supabase.from("room_categories").select("*").eq("hotel_id", id).eq("is_active", true).order("price_per_night"),
      ]);
      if (hotelRes.error) {
        console.error(hotelRes.error);
        toast.error(lang === "ar" ? "حدث خطأ في تحميل البيانات" : "Failed to load data");
        setLoading(false);
        return;
      }
      setHotel(hotelRes.data);
      setPhotos(photosRes.data || []);
      setRooms(roomsRes.data || []);
      setLoading(false);
    };
    load();
  }, [id]);

  // Fetch available rooms when dates change
  useEffect(() => {
    if (!checkIn || !checkOut || !hotel?.id) return;

    const fetchAvailableRooms = async () => {
      setAvailabilityLoading(true);
      setIsDateBlocked(false);

      // Check blocked dates for apartments/non-sync properties
      if ((hotel as any).property_type === "apartment") {
        // Check manually blocked dates
        const { data: blocked } = await supabase
          .from("blocked_dates")
          .select("blocked_date")
          .eq("hotel_id", hotel.id)
          .gte("blocked_date", checkIn)
          .lt("blocked_date", checkOut);

        // Also check existing confirmed bookings for overlap
        const { data: existingBookings } = await supabase
          .from("bookings")
          .select("check_in, check_out")
          .eq("hotel_id", hotel.id)
          .in("status", ["confirmed", "active", "checked_in"])
          .lt("check_in", checkOut)
          .gt("check_out", checkIn);

        if ((blocked?.length ?? 0) > 0 || (existingBookings?.length ?? 0) > 0) {
          setIsDateBlocked(true);
          setAvailableRooms([]);
          setHasSearched(true);
          setAvailabilityLoading(false);
          return;
        }
      }

      // Use multi-provider API router (falls back to Supabase automatically)
      const normalizedRooms = await getRoomsByHotel(hotel.id);
      setAvailableRooms(normalizedRooms);
      setHasSearched(true);
      setAvailabilityLoading(false);
    };

    fetchAvailableRooms();
  }, [checkIn, checkOut, hotel?.id]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10 space-y-6">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
      </Layout>
    );
  }

  if (!hotel) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("hotel.notFound")}</h1>
        </div>
      </Layout>
    );
  }

  const name = lang === "ar" ? hotel.name_ar : hotel.name_en;
  const description = lang === "ar" ? hotel.description_ar : hotel.description_en;
  const allImages = photos.length > 0 ? photos.map((p: any) => p.url) : (hotel.cover_image ? [hotel.cover_image] : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"]);
  const BackArrow = lang === "ar" ? ArrowRight : ArrowLeft;
  const minPrice = rooms.length > 0 ? Math.min(...rooms.map((r: any) => r.price_per_night)) : null;
  const isApartment = (hotel as any).property_type === "apartment";

  // Group available rooms by category
  const availableByCategory: Record<string, any[]> = {};
  for (const ar of availableRooms) {
    const cat = ar.category_name ?? "other";
    if (!availableByCategory[cat]) availableByCategory[cat] = [];
    availableByCategory[cat].push(ar);
  }

  return (
    <Layout>
      {/* Back button */}
      <div className="container mx-auto px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <BackArrow className="w-4 h-4" />
          {tx("رجوع", "Back")}
        </button>
      </div>

      {/* Gallery */}
      <div className="relative h-72 md:h-[28rem] overflow-hidden mt-2">
        <img src={allImages[galleryIdx]} alt={name} className="w-full h-full object-cover transition-all duration-500" />
        {allImages.length > 1 && (
          <>
            <button onClick={() => setGalleryIdx((galleryIdx - 1 + allImages.length) % allImages.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm p-2 rounded-full hover:bg-card transition">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button onClick={() => setGalleryIdx((galleryIdx + 1) % allImages.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm p-2 rounded-full hover:bg-card transition">
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_: any, i: number) => (
                <button key={i} onClick={() => setGalleryIdx(i)} className={`w-2.5 h-2.5 rounded-full transition ${i === galleryIdx ? "bg-primary" : "bg-card/60"}`} />
              ))}
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-accent/70 to-transparent pointer-events-none" />
        <div className="absolute bottom-6 left-0 right-0 container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: hotel.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isApartment ? "bg-blue-500/80 text-white" : "bg-card/80 text-foreground"}`}>
                {isApartment ? tx("🏠 شقة سياحية", "🏠 Apartment") : tx("🏨 فندق", "🏨 Hotel")}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-accent-foreground">{name}</h1>
            <div className="flex items-center gap-2 text-accent-foreground/80 mt-1">
              <MapPin className="w-4 h-4" /> {hotel.city}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {allImages.length > 1 && (
        <div className="container mx-auto px-4 -mt-6 relative z-10">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allImages.map((img: string, i: number) => (
              <button key={i} onClick={() => setGalleryIdx(i)} className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${i === galleryIdx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-10 space-y-10">
        {/* Price header */}
        {minPrice && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="ms-auto text-2xl font-bold text-foreground" dir="ltr">
              {tx("من", "From")} ${minPrice}
              <span className="text-sm font-normal text-muted-foreground">{t("hotel.perNight")}</span>
            </div>
          </div>
        )}

        {/* About */}
        {description && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">{t("hotel.about")}</h2>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </div>
        )}

        {/* Breakfast Info */}
        {(hotel as any).breakfast_available && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-2xl">🍳</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                {tx("الفطور متاح", "Breakfast Available")}
              </p>
              <p className="text-xs text-amber-700">
                {(hotel as any).breakfast_type === "all_year"
                  ? tx("طوال السنة", "All year round")
                  : tx(
                      `من ${(hotel as any).breakfast_season_start} إلى ${(hotel as any).breakfast_season_end}`,
                      `${(hotel as any).breakfast_season_start} → ${(hotel as any).breakfast_season_end}`
                    )
                }
                {" — "}
                <strong>${(hotel as any).breakfast_price}</strong>
                {tx(" / شخص / ليلة", " / person / night")}
              </p>
            </div>
          </div>
        )}

        {/* Amenities */}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-3">{t("hotel.amenities")}</h2>
            <div className="flex flex-wrap gap-2">
              {hotel.amenities.map((a: string) => (
                <span key={a} className="bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-primary" /> {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Date Picker for Availability */}
        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            {tx("ابحث عن غرف متاحة", "Search Available Rooms")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {tx("تاريخ الوصول", "Check-in")} *
              </label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={e => {
                  setCheckIn(e.target.value);
                  if (checkOut && checkOut <= e.target.value) setCheckOut("");
                  setHasSearched(false);
                  setIsDateBlocked(false);
                }}
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {tx("تاريخ المغادرة", "Check-out")} *
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={e => {
                  setCheckOut(e.target.value);
                  setHasSearched(false);
                  setIsDateBlocked(false);
                }}
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground"
              />
            </div>
          </div>

          {/* Blocked date alert */}
          {isDateBlocked && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <span className="text-2xl">🚫</span>
              <p className="text-sm text-red-700 font-medium">
                {tx("هذه الشقة غير متاحة في التواريخ المختارة. يرجى اختيار تواريخ أخرى.",
                    "This apartment is not available for the selected dates. Please choose different dates.")}
              </p>
            </div>
          )}

          {hasSearched && !availabilityLoading && !isDateBlocked && (
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                {availableRooms.length} {tx("غرفة متاحة", "rooms available")}
              </span>
            </div>
          )}
        </div>

        {/* Apartment Details */}
        {isApartment && (hotel as any).bedrooms && (
          <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {tx("🏠 تفاصيل الشقة", "🏠 Apartment Details")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(hotel as any).bedrooms && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{(hotel as any).bedrooms}</p>
                  <p className="text-xs text-muted-foreground">{tx("غرف نوم", "Bedrooms")}</p>
                </div>
              )}
              {(hotel as any).bathrooms && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{(hotel as any).bathrooms}</p>
                  <p className="text-xs text-muted-foreground">{tx("حمامات", "Bathrooms")}</p>
                </div>
              )}
              {(hotel as any).area_sqm && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{(hotel as any).area_sqm}</p>
                  <p className="text-xs text-muted-foreground">{tx("م²", "m²")}</p>
                </div>
              )}
              {(hotel as any).floor != null && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{(hotel as any).floor}</p>
                  <p className="text-xs text-muted-foreground">{tx("الطابق", "Floor")}</p>
                </div>
              )}
            </div>
            {((hotel as any).check_in_time || (hotel as any).check_out_time) && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>⏰ {tx("الوصول:", "Check-in:")} {(hotel as any).check_in_time}</span>
                <span>⏰ {tx("المغادرة:", "Check-out:")} {(hotel as any).check_out_time}</span>
              </div>
            )}
            {(hotel as any).neighborhood && (
              <p className="text-sm text-muted-foreground">
                📍 {tx("الحي:", "Neighborhood:")} {(hotel as any).neighborhood}
              </p>
            )}
            {((hotel as any).house_rules_ar || (hotel as any).house_rules_en) && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  📋 {tx("قواعد الإقامة", "House Rules")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lang === "ar" ? (hotel as any).house_rules_ar : (hotel as any).house_rules_en}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Room Categories with Pricing Table */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">{t("hotel.rooms")}</h2>
          {rooms.length === 0 ? (
            <p className="text-muted-foreground">{tx("لا توجد غرف متاحة حالياً", "No rooms available at the moment")}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rooms.map((room: any, i: number) => {
                const roomName = lang === "ar" ? room.name_ar : room.name_en;
                const deposit = Math.round(room.price_per_night * DEPOSIT_PERCENT / 100);
                const balance = room.price_per_night - deposit;

                const categoryAvailable = hasSearched
                  ? availableRooms.filter(ar =>
                      ar.room_category_id === room.id ||
                      ar.category_name?.toLowerCase() === room.name_en?.toLowerCase()
                    )
                  : [];

                // For apartments or manual-mode properties without room_availability, allow direct booking
                const hasNoSyncRooms = hasSearched && availableRooms.length === 0 && !isDateBlocked;
                const canDirectBook = hasNoSyncRooms && (isApartment || (hotel as any).manual_mode);

                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card rounded-xl overflow-hidden shadow-card border border-border/50"
                  >
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground text-lg">{roomName}</h3>
                        {hasSearched ? (
                          <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                            (categoryAvailable.length > 0 || canDirectBook) && !isDateBlocked
                              ? "bg-primary/10 text-primary"
                              : "bg-destructive/10 text-destructive"
                          }`}>
                            {isDateBlocked
                              ? tx("محجوزة", "Blocked")
                              : canDirectBook
                                ? tx("متاحة", "Available")
                                : categoryAvailable.length > 0
                                  ? `${categoryAvailable.length} ${tx("متاحة", "available")}`
                                  : tx("غير متاحة", "Unavailable")}
                          </span>
                        ) : (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">{t("hotel.available")}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" /> {t("hotel.upTo")} {room.max_guests} {t("hotel.guests")}
                      </div>

                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {room.amenities.map((a: string) => (
                            <span key={a} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">{a}</span>
                          ))}
                        </div>
                      )}

                      {/* Pricing Breakdown Table */}
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border/30">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {tx("تفاصيل التسعير", "Pricing Breakdown")}
                        </h4>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{tx("السعر الإجمالي / ليلة", "Total Price / Night")}</span>
                            <span className="font-semibold text-foreground" dir="ltr">${room.price_per_night}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{tx(`العربون المطلوب (${DEPOSIT_PERCENT}%)`, `Required Deposit (${DEPOSIT_PERCENT}%)`)}</span>
                            <span className="font-semibold text-primary" dir="ltr">${deposit}</span>
                          </div>
                          <div className="flex justify-between border-t border-border/50 pt-1.5">
                            <span className="text-muted-foreground">{tx("الباقي عند الوصول", "Balance Due at Check-in")}</span>
                            <span className="font-medium text-foreground" dir="ltr">${balance}</span>
                          </div>
                        </div>
                      </div>

                      {/* Available room numbers (from API sync) */}
                      {hasSearched && categoryAvailable.length > 0 && !isDateBlocked && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground">
                            {tx("اختر غرفة:", "Select a room:")}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {categoryAvailable.map((ar: any) => (
                              <button
                                key={ar.id}
                                onClick={() => navigate(`/booking?hotel=${hotel.id}&room=${room.id}&room_number=${ar.room_number}&check_in=${checkIn}&check_out=${checkOut}`)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition font-medium"
                              >
                                #{ar.room_number}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Direct booking for apartments / non-sync properties */}
                      {hasSearched && canDirectBook && (
                        <button
                          onClick={() => navigate(`/booking?hotel=${hotel.id}&room=${room.id}&check_in=${checkIn}&check_out=${checkOut}`)}
                          className="w-full gradient-cta text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
                        >
                          {tx("احجز الآن", "Book Now")}
                        </button>
                      )}

                      {/* Fallback: no dates selected yet */}
                      {!hasSearched && (
                        <p className="text-xs text-muted-foreground text-center py-1">
                          {tx("اختر التواريخ أعلاه لعرض الغرف المتاحة", "Select dates above to check availability")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HotelDetails;
