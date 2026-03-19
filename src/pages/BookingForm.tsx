import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Users, CreditCard,
         CheckCircle, FileText, Phone, Mail,
         Globe, Shield, Calendar, MapPin, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

const DEPOSIT_PERCENT = 10;

type Step = "details" | "payment" | "voucher";

const PHONE_CODES = [
  { code: "+963", flag: "🇸🇾", name: "Syria", nameAr: "سوريا" },
  { code: "+90",  flag: "🇹🇷", name: "Turkey", nameAr: "تركيا" },
  { code: "+49",  flag: "🇩🇪", name: "Germany", nameAr: "ألمانيا" },
  { code: "+46",  flag: "🇸🇪", name: "Sweden", nameAr: "السويد" },
  { code: "+47",  flag: "🇳🇴", name: "Norway", nameAr: "النرويج" },
  { code: "+971", flag: "🇦🇪", name: "UAE", nameAr: "الإمارات" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia", nameAr: "السعودية" },
  { code: "+962", flag: "🇯🇴", name: "Jordan", nameAr: "الأردن" },
  { code: "+961", flag: "🇱🇧", name: "Lebanon", nameAr: "لبنان" },
  { code: "+964", flag: "🇮🇶", name: "Iraq", nameAr: "العراق" },
  { code: "+20",  flag: "🇪🇬", name: "Egypt", nameAr: "مصر" },
  { code: "+212", flag: "🇲🇦", name: "Morocco", nameAr: "المغرب" },
  { code: "+216", flag: "🇹🇳", name: "Tunisia", nameAr: "تونس" },
  { code: "+213", flag: "🇩🇿", name: "Algeria", nameAr: "الجزائر" },
  { code: "+33",  flag: "🇫🇷", name: "France", nameAr: "فرنسا" },
  { code: "+44",  flag: "🇬🇧", name: "UK", nameAr: "المملكة المتحدة" },
  { code: "+1",   flag: "🇺🇸", name: "USA / Canada", nameAr: "أمريكا / كندا" },
  { code: "+31",  flag: "🇳🇱", name: "Netherlands", nameAr: "هولندا" },
  { code: "+32",  flag: "🇧🇪", name: "Belgium", nameAr: "بلجيكا" },
  { code: "+41",  flag: "🇨🇭", name: "Switzerland", nameAr: "سويسرا" },
  { code: "+43",  flag: "🇦🇹", name: "Austria", nameAr: "النمسا" },
  { code: "+39",  flag: "🇮🇹", name: "Italy", nameAr: "إيطاليا" },
  { code: "+34",  flag: "🇪🇸", name: "Spain", nameAr: "إسبانيا" },
  { code: "+30",  flag: "🇬🇷", name: "Greece", nameAr: "اليونان" },
  { code: "+7",   flag: "🇷🇺", name: "Russia", nameAr: "روسيا" },
  { code: "+86",  flag: "🇨🇳", name: "China", nameAr: "الصين" },
  { code: "+81",  flag: "🇯🇵", name: "Japan", nameAr: "اليابان" },
  { code: "+82",  flag: "🇰🇷", name: "South Korea", nameAr: "كوريا الجنوبية" },
];

const NATIONALITIES = [
  { value: "Syrian",       labelAr: "سوري / سورية",       labelEn: "Syrian" },
  { value: "Turkish",      labelAr: "تركي / تركية",        labelEn: "Turkish" },
  { value: "German",       labelAr: "ألماني / ألمانية",    labelEn: "German" },
  { value: "Swedish",      labelAr: "سويدي / سويدية",      labelEn: "Swedish" },
  { value: "Norwegian",    labelAr: "نرويجي / نرويجية",    labelEn: "Norwegian" },
  { value: "Emirati",      labelAr: "إماراتي / إماراتية",  labelEn: "Emirati" },
  { value: "Saudi",        labelAr: "سعودي / سعودية",      labelEn: "Saudi" },
  { value: "Jordanian",    labelAr: "أردني / أردنية",      labelEn: "Jordanian" },
  { value: "Lebanese",     labelAr: "لبناني / لبنانية",    labelEn: "Lebanese" },
  { value: "Iraqi",        labelAr: "عراقي / عراقية",      labelEn: "Iraqi" },
  { value: "Egyptian",     labelAr: "مصري / مصرية",        labelEn: "Egyptian" },
  { value: "Moroccan",     labelAr: "مغربي / مغربية",      labelEn: "Moroccan" },
  { value: "Tunisian",     labelAr: "تونسي / تونسية",      labelEn: "Tunisian" },
  { value: "Algerian",     labelAr: "جزائري / جزائرية",    labelEn: "Algerian" },
  { value: "French",       labelAr: "فرنسي / فرنسية",      labelEn: "French" },
  { value: "British",      labelAr: "بريطاني / بريطانية",  labelEn: "British" },
  { value: "American",     labelAr: "أمريكي / أمريكية",    labelEn: "American" },
  { value: "Dutch",        labelAr: "هولندي / هولندية",    labelEn: "Dutch" },
  { value: "Belgian",      labelAr: "بلجيكي / بلجيكية",    labelEn: "Belgian" },
  { value: "Swiss",        labelAr: "سويسري / سويسرية",    labelEn: "Swiss" },
  { value: "Austrian",     labelAr: "نمساوي / نمساوية",    labelEn: "Austrian" },
  { value: "Italian",      labelAr: "إيطالي / إيطالية",    labelEn: "Italian" },
  { value: "Spanish",      labelAr: "إسباني / إسبانية",    labelEn: "Spanish" },
  { value: "Russian",      labelAr: "روسي / روسية",        labelEn: "Russian" },
  { value: "Chinese",      labelAr: "صيني / صينية",        labelEn: "Chinese" },
  { value: "Japanese",     labelAr: "ياباني / يابانية",    labelEn: "Japanese" },
  { value: "Korean",       labelAr: "كوري / كورية",        labelEn: "Korean" },
  { value: "Other",        labelAr: "أخرى",                labelEn: "Other" },
];

import { isPeakSeason } from "@/lib/utils";

const BookingForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hotelId = searchParams.get("hotel") || "";
  const roomId = searchParams.get("room") || "";
  const roomNumberParam = searchParams.get("room_number") || "";
  const checkInParam = searchParams.get("check_in") || "";
  const checkOutParam = searchParams.get("check_out") || "";
  const { t, lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;
  const BackArrow = lang === "ar" ? ArrowRight : ArrowLeft;

  const [step, setStep] = useState<Step>("details");
  const [hotel, setHotel] = useState<Tables<'hotels'> | null>(null);
  const [room, setRoom] = useState<Tables<'room_categories'> | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCode, setPhoneCode] = useState("+963");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [guests, setGuests] = useState(1);
  const [checkIn, setCheckIn] = useState(checkInParam);
  const [checkOut, setCheckOut] = useState(checkOutParam);
  const [specialRequests, setSpecialRequests] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Children ages
  const [childrenAges, setChildrenAges] = useState<number[]>([]);

  // Breakfast
  const [breakfastIncluded, setBreakfastIncluded] = useState<boolean | null>(null);

  // Extra room
  const [extraRoom, setExtraRoom] = useState<any>(null);
  const [availableExtraRooms, setAvailableExtraRooms] = useState<any[]>([]);

  // Children calculations
  const childrenAsAdults = childrenAges.filter(age => age >= 14).length;
  const actualChildren = childrenAges.filter(age => age < 14).length;
  const effectiveAdults = guests + childrenAsAdults;
  const totalGuests = effectiveAdults + actualChildren;
  const requiredAdults = actualChildren >= 3 ? Math.ceil(actualChildren / 3) : 1;
  const supervisorOk = actualChildren < 3 || effectiveAdults >= requiredAdults;

  // Payment / Voucher
  const [processing, setProcessing] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!hotelId || !roomId) return;
    const load = async () => {
      const [h, r] = await Promise.all([
        supabase.from("hotels").select("*").eq("id", hotelId).single(),
        supabase.from("room_categories").select("*").eq("id", roomId).single(),
      ]);
      setHotel(h.data);
      setRoom(r.data);
      setLoading(false);
    };
    load();
  }, [hotelId, roomId]);

  // Detect Stripe return
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (sessionId && step !== "voucher") {
      const fetchBooking = async () => {
        setLoading(true);
        const { data } = await supabase
          .from("bookings")
          .select("*, hotels(*), room_categories(*)")
          .eq("stripe_payment_id", sessionId)
          .maybeSingle();

        if (data) {
          setBookingId(data.id);
          setHotel(data.hotels);
          setRoom(data.room_categories);
          setFirstName(data.guest_first_name);
          setLastName(data.guest_last_name);
          setEmail(data.guest_email);
          setCheckIn(data.check_in);
          setCheckOut(data.check_out);
          setStep("voucher");
        }
        setLoading(false);
      };
      fetchBooking();
    }
  }, []);

  // Breakfast helpers
  const hotelData = hotel as any;

  const breakfastInSeason = () => {
    if (!hotelData?.breakfast_available) return false;
    if (hotelData.breakfast_type === "all_year") return true;
    if (hotelData.breakfast_type === "seasonal" && checkIn) {
      const d = new Date(checkIn);
      const s = new Date(hotelData.breakfast_season_start);
      const e = new Date(hotelData.breakfast_season_end);
      const md = (x: Date) => x.getMonth() * 100 + x.getDate();
      return md(d) >= md(s) && md(d) <= md(e);
    }
    return false;
  };

  // Extra room logic
  const roomCapacity = room?.max_guests ?? 0;
  const needsExtraRoom = totalGuests > roomCapacity;

  useEffect(() => {
    if (!needsExtraRoom || !hotel?.id || !room?.id) return;
    supabase.from("room_categories").select("*")
      .eq("hotel_id", hotel.id).eq("is_active", true)
      .neq("id", room.id)
      .then(({ data }) => setAvailableExtraRooms(data ?? []));
  }, [needsExtraRoom, hotel?.id, room?.id]);

  // Price calculations
  const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1;
  const roomPrice = room ? room.price_per_night : 0;
  const room1Total = roomPrice * nights;
  const room2Total = extraRoom ? (extraRoom.price_per_night ?? 0) * nights : 0;
  const totalPrice = room1Total + room2Total;
  const deposit1 = Math.round(room1Total * DEPOSIT_PERCENT / 100);
  const deposit2 = Math.round(room2Total * DEPOSIT_PERCENT / 100);
  const totalDeposit = deposit1 + deposit2;
  const totalBalance = totalPrice - totalDeposit;

  const handleStripeCheckout = async () => {
    setProcessing(true);
    try {
      const fullPhone = `${phoneCode}${phone}`;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          hotel_id: hotelId,
          room_category_id: roomId,
          guest_first_name: firstName,
          guest_last_name: lastName,
          guest_email: email,
          guest_phone: fullPhone,
          nationality,
          guests_count: effectiveAdults,
          children_count: actualChildren,
          children_ages: childrenAges,
          breakfast_included: breakfastIncluded ?? false,
          check_in: checkIn,
          check_out: checkOut,
          nights,
          total_price: totalPrice,
          deposit_amount: totalDeposit,
          special_requests: specialRequests || null,
          room_number: roomNumberParam || null,
          hotel_name: lang === "ar" ? hotel?.name_ar : hotel?.name_en,
          room_name: lang === "ar" ? room?.name_ar : room?.name_en,
          extra_room: extraRoom ? {
            room_category_id: extraRoom.id,
            price_per_night: extraRoom.price_per_night,
            deposit_amount: deposit2,
          } : null,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL");
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || tx("حدث خطأ", "An error occurred"));
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-pulse text-muted-foreground">{tx("جاري التحميل...", "Loading...")}</div>
        </div>
      </Layout>
    );
  }

  if (!hotel || !room) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">{tx("لم يتم العثور على البيانات", "Data not found")}</h1>
          <button onClick={() => navigate("/hotels")} className="text-primary underline">{tx("تصفح الفنادق", "Browse Hotels")}</button>
        </div>
      </Layout>
    );
  }

  const hotelName = lang === "ar" ? hotel.name_ar : hotel.name_en;
  const roomName = lang === "ar" ? room.name_ar : room.name_en;

  const steps: { key: Step; label: string; icon: any }[] = [
    { key: "details", label: tx("المعلومات", "Details"), icon: FileText },
    { key: "payment", label: tx("الدفع", "Payment"), icon: CreditCard },
    { key: "voucher", label: tx("القسيمة", "Voucher"), icon: CheckCircle },
  ];
  const currentStepIdx = steps.findIndex(s => s.key === step);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Back button */}
        <button onClick={() => {
          if (step === "details") navigate(-1);
          else if (step === "payment") setStep("details");
        }} className={`flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 ${step === "voucher" ? "invisible" : ""}`}>
          <BackArrow className="w-4 h-4" />
          {tx("رجوع", "Back")}
        </button>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${i <= currentStepIdx ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <s.icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-6 h-0.5 rounded ${i < currentStepIdx ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 pb-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Step 1: Guest Details */}
            {step === "details" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-xl p-6 shadow-card border border-border/50 space-y-5">
                <h2 className="font-semibold text-foreground text-lg">{t("booking.guestInfo")}</h2>

                {/* A) Name row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t("booking.firstName")} *</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} required
                      className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t("booking.lastName")} *</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} required
                      className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition" />
                  </div>
                </div>

                {/* B) Contact row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      {tx("البريد الإلكتروني", "Email Address")} *
                    </label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition"
                      dir="ltr" />
                    <p className="text-[10px] text-muted-foreground">
                      {tx("ستصلك قسيمة الحجز والتأكيد على هذا البريد",
                          "Your booking voucher and confirmation will be sent here")}
                    </p>
                  </div>

                  {/* Phone with country code */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      {tx("رقم الهاتف", "Phone Number")} *
                    </label>
                    <div className="flex gap-2">
                      <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                        className="bg-muted rounded-lg px-2 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition w-32 shrink-0 cursor-pointer"
                        dir="ltr">
                        {PHONE_CODES.map(c => (
                          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="912345678"
                        className="flex-1 bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition"
                        dir="ltr" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {tx("رقم للتواصل في حالة الطوارئ أو تغييرات الحجز",
                          "For emergency contact or booking changes")}
                    </p>
                  </div>
                </div>

                {/* C) Nationality + D) Adults */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-primary" />
                      {tx("الجنسية", "Nationality")} *
                    </label>
                    <select value={nationality} onChange={e => setNationality(e.target.value)}
                      className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition cursor-pointer">
                      <option value="">{tx("اختر جنسيتك", "Select your nationality")}</option>
                      {NATIONALITIES.map(n => (
                        <option key={n.value} value={n.value}>
                          {lang === "ar" ? n.labelAr : n.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      {tx("عدد البالغين", "Adults")} *
                    </label>
                    <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2">
                      <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-card text-foreground font-bold text-lg transition shrink-0">
                        −
                      </button>
                      <span className="flex-1 text-center text-sm font-medium text-foreground">
                        {guests} {tx(guests === 1 ? "بالغ" : "بالغين", guests === 1 ? "Adult" : "Adults")}
                      </span>
                      <button type="button" onClick={() => setGuests(guests + 1)}
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-card text-foreground font-bold text-lg transition shrink-0">
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Children Ages */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {tx("أطفال", "Children")}
                    </span>
                    <div className="flex items-center gap-3">
                      <button type="button"
                        onClick={() => setChildrenAges(prev => prev.slice(0, -1))}
                        disabled={childrenAges.length === 0}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 transition">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-semibold text-foreground">{childrenAges.length}</span>
                      <button type="button"
                        onClick={() => setChildrenAges(prev => [...prev, 5])}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {childrenAges.map((age, idx) => (
                    <div key={idx} className="flex items-center gap-3 ps-2">
                      <span className="text-xs text-muted-foreground w-20">
                        {tx(`الطفل ${idx + 1}`, `Child ${idx + 1}`)}
                      </span>
                      <select value={age}
                        onChange={e => {
                          const updated = [...childrenAges];
                          updated[idx] = +e.target.value;
                          setChildrenAges(updated);
                        }}
                        className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm outline-none text-foreground border border-border/50">
                        {Array.from({ length: 18 }, (_, i) => (
                          <option key={i} value={i}>{i} {tx("سنة", "yr")}</option>
                        ))}
                      </select>
                      {age >= 14 && (
                        <span className="text-xs text-amber-600 font-medium shrink-0">
                          {tx("← يُحسب بالغ", "← Adult")}
                        </span>
                      )}
                    </div>
                  ))}

                  {childrenAsAdults > 0 && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                      ⚠️ {tx(
                        `${childrenAsAdults} طفل سيُحسب كبالغ (14 سنة فأكثر)`,
                        `${childrenAsAdults} child counted as adult (14+)`
                      )}
                    </p>
                  )}
                  {actualChildren >= 3 && !supervisorOk && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                      <p className="font-semibold">⚠️ {tx("يجب وجود بالغ مشرف","Supervising adult required")}</p>
                      <p>{tx(
                        `${actualChildren} أطفال يتطلبون ${requiredAdults} بالغ. لديك ${effectiveAdults}.`,
                        `${actualChildren} children require ${requiredAdults} adult(s). You have ${effectiveAdults}.`
                      )}</p>
                      <p className="text-xs text-red-500 mt-1">
                        {tx("القاعدة: بالغ واحد لكل 3 أطفال","Rule: 1 adult per 3 children (under 14)")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Extra room suggestion */}
                {needsExtraRoom && (
                  <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
                    <p className="font-semibold text-amber-800 text-sm">
                      ⚠️ {tx(
                        `الغرفة تتسع لـ ${roomCapacity} أشخاص فقط. أنت حددت ${totalGuests}.`,
                        `Room fits ${roomCapacity} guests. You selected ${totalGuests}.`
                      )}
                    </p>
                    <label className="text-sm font-medium text-foreground">{tx("اختر غرفة إضافية", "Select additional room")}</label>
                    <select className="w-full bg-card border border-amber-300 rounded-lg px-3 py-2 text-sm"
                      value={extraRoom?.id ?? ""}
                      onChange={e => {
                        const r = availableExtraRooms.find(x => x.id === e.target.value);
                        setExtraRoom(r ?? null);
                      }}>
                      <option value="">{tx("-- اختر --", "-- Select --")}</option>
                      {availableExtraRooms.map(r => (
                        <option key={r.id} value={r.id}>
                          {tx(r.name_ar, r.name_en)} — ${r.price_per_night}/{tx("ليلة", "night")} ({r.max_guests} {tx("أشخاص", "guests")})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Breakfast Question */}
                {breakfastInSeason() && (
                  <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🍳</span>
                      <div>
                        <p className="font-semibold text-amber-800">
                          {tx("هذا الفندق يقدم فطور مجاناً متضمن في السعر",
                              "This hotel offers complimentary breakfast included in room rate")}
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">
                          * {tx("هذا السؤال إجباري", "Required")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="breakfast"
                          checked={breakfastIncluded === true}
                          onChange={() => setBreakfastIncluded(true)}
                          className="accent-primary" />
                        <span className="text-sm font-medium text-green-700">
                          ✅ {tx("نعم، أريد الفطور", "Yes, include breakfast")}
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="breakfast"
                          checked={breakfastIncluded === false}
                          onChange={() => setBreakfastIncluded(false)}
                          className="accent-primary" />
                        <span className="text-sm font-medium text-muted-foreground">
                          ❌ {tx("لا شكراً", "No thanks")}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* E) Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {tx("تاريخ الوصول", "Check-in Date")} *
                    </label>
                    <input type="date" value={checkIn} min={today}
                      onChange={e => {
                        setCheckIn(e.target.value);
                        if (checkOut && checkOut <= e.target.value) setCheckOut("");
                      }}
                      className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {tx("تاريخ المغادرة", "Check-out Date")} *
                    </label>
                    <input type="date" value={checkOut} min={checkIn || today}
                      onChange={e => setCheckOut(e.target.value)}
                      className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground" />
                  </div>
                </div>

                {checkIn && checkOut && (
                  <div className="flex items-center justify-between bg-primary/5 rounded-lg px-4 py-2 border border-primary/20">
                    <span className="text-sm text-muted-foreground">{tx("عدد الليالي", "Number of nights")}</span>
                    <span className="font-bold text-primary">{nights} {tx("ليالي", nights === 1 ? "night" : "nights")}</span>
                  </div>
                )}

                {/* F) Special Requests */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t("booking.specialRequests")}</label>
                  <textarea rows={3} value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                    className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground resize-none focus:ring-2 focus:ring-primary/30 transition"
                    placeholder={t("booking.specialPlaceholder")} />
                </div>

                {/* G) Terms checkbox */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary cursor-pointer shrink-0" />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {tx("أوافق على ", "I agree to the ")}
                    <Link to="/terms" target="_blank" className="text-primary underline underline-offset-2">
                      {tx("الشروط والأحكام", "Terms & Conditions")}
                    </Link>
                    {tx(" وسياسة ", " and ")}
                    <Link to="/privacy" target="_blank" className="text-primary underline underline-offset-2">
                      {tx("الخصوصية", "Privacy Policy")}
                    </Link>
                    {tx("، بما فيها عدم الاسترداد في مواسم الذروة.",
                        ", including the no-refund policy during peak seasons.")}
                  </span>
                </label>

                {/* H) Next button */}
                <button
                  onClick={() => {
                    if (!firstName || !lastName) {
                      toast.error(tx("الرجاء إدخال الاسم الأول والأخير", "Please enter first and last name"));
                      return;
                    }
                    if (!email || !email.includes("@")) {
                      toast.error(tx("الرجاء إدخال بريد إلكتروني صحيح", "Please enter a valid email"));
                      return;
                    }
                    if (!phone || phone.length < 7) {
                      toast.error(tx("الرجاء إدخال رقم هاتف صحيح", "Please enter a valid phone number"));
                      return;
                    }
                    if (!nationality) {
                      toast.error(tx("الرجاء اختيار الجنسية", "Please select your nationality"));
                      return;
                    }
                    if (!checkIn || !checkOut) {
                      toast.error(tx("الرجاء تحديد تواريخ الإقامة", "Please select check-in and check-out dates"));
                      return;
                    }
                    if (new Date(checkOut) <= new Date(checkIn)) {
                      toast.error(tx("تاريخ المغادرة يجب أن يكون بعد الوصول", "Check-out must be after check-in"));
                      return;
                    }
                    if (breakfastInSeason() && breakfastIncluded === null) {
                      toast.error(tx("يرجى الإجابة على سؤال الفطور", "Please answer the breakfast question"));
                      return;
                    }
                    if (actualChildren >= 3 && !supervisorOk) {
                      toast.error(tx(
                        `يجب إضافة ${requiredAdults - effectiveAdults} بالغ مشرف`,
                        `Please add ${requiredAdults - effectiveAdults} supervising adult(s)`
                      ));
                      return;
                    }
                    if (!termsAccepted) {
                      toast.error(tx("يجب الموافقة على الشروط والأحكام", "You must accept the Terms & Conditions"));
                      return;
                    }
                    setStep("payment");
                  }}
                  className="w-full gradient-cta text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  {tx("التالي: الدفع", "Next: Payment")}
                </button>
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {step === "payment" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-xl p-6 shadow-card border border-border/50 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground text-lg">{tx("دفع العربون", "Deposit Payment")}</h2>
                    <p className="text-xs text-muted-foreground">{tx("ادفع العربون فقط لتأكيد حجزك", "Pay only the deposit to confirm your booking")}</p>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="space-y-2 text-sm border border-border/50 rounded-xl p-4">
                  <p className="font-semibold mb-2">{tx("ملخص السعر", "Price Summary")}</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {tx("الغرفة الأولى", "Room 1")} × {nights} {tx("ليالي", "nights")}
                    </span>
                    <span className="font-medium text-foreground" dir="ltr">${room1Total}</span>
                  </div>
                  {extraRoom && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {tx("الغرفة الثانية", "Room 2")} × {nights} {tx("ليالي", "nights")}
                      </span>
                      <span className="font-medium text-foreground" dir="ltr">${room2Total}</span>
                    </div>
                  )}
                  {breakfastIncluded && (
                    <div className="flex justify-between text-amber-700">
                      <span>🍳 {tx("الفطور", "Breakfast")}</span>
                      <span>{tx("متضمن", "Included")}</span>
                    </div>
                  )}
                  <div className="border-t border-border/30 pt-2 flex justify-between font-bold">
                    <span>{tx("الإجمالي", "Total")}</span>
                    <span dir="ltr">${totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>{tx("العربون 10%", "Deposit 10%")}</span>
                    <span dir="ltr">${totalDeposit}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>{tx("الباقي نقداً", "Balance cash")}</span>
                    <span dir="ltr">${totalBalance}</span>
                  </div>
                  {extraRoom && (
                    <div className="bg-muted/50 rounded-lg p-2 text-xs text-muted-foreground space-y-1 mt-1">
                      <p>• {tx("عربون الغرفة 1:", "Room 1 deposit:")} ${deposit1}</p>
                      <p>• {tx("عربون الغرفة 2:", "Room 2 deposit:")} ${deposit2}</p>
                      <p className="text-primary font-medium">
                        {tx("يُدفع مجموعهما في دفعة واحدة", "Paid together in one payment")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stripe info */}
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <p className="text-xs text-primary font-medium flex items-start gap-2">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                    {tx("الدفع الآمن عبر Stripe. لا نخزن بيانات بطاقتك. المبلغ المطلوب هو العربون فقط.",
                        "Secure payment via Stripe. We never store your card details. Only the deposit is charged.")}
                  </p>
                </div>

                {/* Peak season warning */}
                {isPeakSeason(checkIn) && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">
                          {tx("تنبيه: موسم الذروة — لا استرداد", "Warning: Peak Season — No Refund")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx("حجزك في موسم الصيف (15 يونيو – 15 سبتمبر). العربون (10%) غير قابل للاسترداد.",
                              "Your booking is in Summer peak season (Jun 15 – Sep 15). The 10% deposit is non-refundable.")}
                        </p>
                        <Link to="/terms" target="_blank" className="text-xs text-primary underline underline-offset-2">
                          {tx("اقرأ سياسة الإلغاء الكاملة", "Read full cancellation policy")}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStripeCheckout}
                  disabled={processing}
                  className="w-full gradient-cta text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {processing ? tx("جاري المعالجة...", "Processing...") : tx(`ادفع $${totalDeposit} عربون عبر Stripe`, `Pay $${totalDeposit} Deposit via Stripe`)}
                </button>
              </motion.div>
            )}

            {/* Step 3: Voucher */}
            {step === "voucher" && bookingId && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-xl p-8 shadow-card border border-border/50 text-center space-y-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
                  <CheckCircle className="w-16 h-16 text-primary mx-auto" />
                </motion.div>

                <h1 className="text-2xl font-extrabold text-foreground">{tx("تم تأكيد الحجز!", "Booking Confirmed!")}</h1>
                <p className="text-muted-foreground">{tx("تم إرسال حجزك مباشرة إلى الفندق", "Your booking has been sent directly to the hotel")}</p>

                {/* Digital Voucher */}
                <div className="bg-muted/50 rounded-xl p-6 border border-border/30 space-y-4 max-w-sm mx-auto">
                  <h3 className="font-semibold text-foreground">{tx("قسيمة الحجز الرقمية", "Digital Booking Voucher")}</h3>

                  <div className="bg-card p-4 rounded-lg inline-block mx-auto">
                    <QRCodeSVG value={`NAITY-BOOKING:${bookingId}`} size={160} level="H" />
                  </div>

                  <div className="text-start space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tx("الفندق", "Hotel")}</span>
                      <span className="font-medium text-foreground">{hotelName}</span>
                    </div>
                    {roomNumberParam && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{tx("رقم الغرفة", "Room No.")}</span>
                        <span className="font-medium text-foreground">#{roomNumberParam}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tx("الغرفة", "Room")}</span>
                      <span className="font-medium text-foreground">{roomName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tx("الضيف", "Guest")}</span>
                      <span className="font-medium text-foreground">{firstName} {lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("booking.checkIn")}</span>
                      <span className="font-medium text-foreground">{checkIn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("booking.checkOut")}</span>
                      <span className="font-medium text-foreground">{checkOut}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/50 pt-2">
                      <span className="text-muted-foreground">{tx("المدفوع", "Paid")}</span>
                      <span className="font-bold text-primary" dir="ltr">${totalDeposit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tx("المتبقي", "Remaining")}</span>
                      <span className="font-medium text-foreground" dir="ltr">${totalBalance}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">{tx("احفظ هذه القسيمة على هاتفك وأظهرها عند تسجيل الوصول", "Save this voucher to your phone and present it at check-in")}</p>

                <button onClick={() => navigate("/")}
                  className="gradient-cta text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                  {tx("العودة للرئيسية", "Back to Home")}
                </button>

                <button onClick={() => navigate('/my-bookings')}
                  className="text-sm text-primary underline underline-offset-2 hover:opacity-80 transition mt-2 block text-center w-full">
                  {tx("تتبع جميع حجوزاتي بالبريد الإلكتروني", "Track all my bookings by email")}
                </button>
              </motion.div>
            )}
          </div>

          {/* Sidebar summary */}
          {step !== "voucher" && (
            <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 h-fit space-y-4 lg:sticky lg:top-20">
              <h2 className="font-semibold text-foreground text-lg">{t("booking.summary")}</h2>
              {hotel.cover_image && <img src={hotel.cover_image} alt={hotelName} className="w-full h-32 object-cover rounded-lg" />}
              <div>
                <h3 className="font-semibold text-foreground">{hotelName}</h3>
                <p className="text-sm text-muted-foreground">{hotel.city}</p>
              </div>
              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("booking.roomType")}</span>
                  <span className="font-medium text-foreground">{roomName}</span>
                </div>
                {roomNumberParam && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tx("رقم الغرفة", "Room No.")}</span>
                    <span className="font-medium text-foreground">#{roomNumberParam}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("booking.pricePerNight")}</span>
                  <span className="font-medium text-foreground" dir="ltr">${room.price_per_night}</span>
                </div>
                {extraRoom && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tx("غرفة إضافية", "Extra Room")}</span>
                    <span className="font-medium text-foreground" dir="ltr">${extraRoom.price_per_night}/{tx("ليلة", "night")}</span>
                  </div>
                )}
                {checkIn && checkOut && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tx("عدد الليالي", "Nights")}</span>
                      <span className="font-medium text-foreground">{nights}</span>
                    </div>
                    {breakfastIncluded && (
                      <div className="flex justify-between text-amber-700">
                        <span>🍳 {tx("فطور", "Breakfast")}</span>
                        <span>{tx("متضمن", "Included")}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border/50 pt-2">
                      <span className="text-muted-foreground">{tx("الإجمالي", "Total")}</span>
                      <span className="font-bold text-foreground" dir="ltr">${totalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tx("العربون المطلوب", "Deposit Due")}</span>
                      <span className="font-bold text-primary" dir="ltr">${totalDeposit}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tx("البالغين", "Adults")}</span>
                  <span className="font-medium text-foreground">{effectiveAdults}</span>
                </div>
                {actualChildren > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tx("أطفال (أقل من 14)", "Children (<14)")}</span>
                    <span className="font-medium text-foreground">{actualChildren}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BookingForm;
