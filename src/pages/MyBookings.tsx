import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Search, Calendar, MapPin, Star,
         ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { useI18n } from "@/lib/i18n";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { format } from "date-fns";

const DEPOSIT_PERCENT = 10;

const STATUS_CONFIG: Record<string, { ar: string; en: string; classes: string }> = {
  confirmed: { ar: "مؤكد ✓",       en: "Confirmed ✓",   classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  pending:   { ar: "قيد المراجعة", en: "Pending Review", classes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  cancelled: { ar: "ملغي",         en: "Cancelled",      classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  completed: { ar: "مكتمل",        en: "Completed",      classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
};

export default function MyBookings() {
  const { lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [bookings, setBookings] = useState<any[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId]     = useState<string | null>(null);

  const handleSearch = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error(tx("أدخل بريداً إلكترونياً صحيحاً", "Enter a valid email address"));
      return;
    }
    setLoading(true); setBookings(null);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`id, check_in, check_out, total_price, deposit_amount,
                 status, payment_status, transaction_hash, special_requests,
                 guest_first_name, guest_last_name, guest_phone, created_at,
                 hotels ( name_ar, name_en, city, address, cover_image, stars ),
                 room_categories ( name_ar, name_en )`)
        .eq("guest_email", trimmed)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBookings(data ?? []);
    } catch (err: any) {
      toast.error(err.message ?? tx("حدث خطأ", "An error occurred"));
    } finally { setLoading(false); }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(tx("تم النسخ", "Copied!"));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-2xl space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
            {tx("تتبع حجزك", "Track Your Booking")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {tx("أدخل البريد الإلكتروني الذي استخدمته عند الحجز لعرض جميع حجوزاتك وتفاصيلها",
                "Enter the email you used when booking to view all your reservations and details")}
          </p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {tx("البريد الإلكتروني المستخدم في الحجز", "Email Used During Booking")}
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-3 border border-border/50">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="example@email.com"
                className="flex-1 bg-transparent py-3 text-sm outline-none text-foreground" dir="ltr" />
            </div>
            <button onClick={handleSearch} disabled={loading}
              className="gradient-cta text-primary-foreground px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0">
              {loading
                ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                : <Search className="w-4 h-4" />}
              {tx("عرض حجوزاتي", "View Bookings")}
            </button>
          </div>
        </motion.div>

        {/* Results */}
        {bookings !== null && (
          <AnimatePresence mode="wait">
            {bookings.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 space-y-3">
                <p className="text-4xl">🏨</p>
                <p className="font-semibold text-foreground">{tx("لا توجد حجوزات", "No Bookings Found")}</p>
                <p className="text-sm text-muted-foreground">
                  {tx("لا توجد حجوزات مرتبطة بهذا البريد. تأكد من إدخال نفس البريد المستخدم عند الحجز.",
                      "No bookings found for this email. Make sure you used the same email when booking.")}
                </p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">
                  {tx(`وُجد ${bookings.length} حجز`, `Found ${bookings.length} booking${bookings.length !== 1 ? "s" : ""}`)}
                </p>
                {bookings.map((b, i) => {
                  const hotel    = b.hotels;
                  const room     = b.room_categories;
                  const name     = lang === "ar" ? hotel?.name_ar : hotel?.name_en;
                  const roomName = lang === "ar" ? room?.name_ar  : room?.name_en;
                  const nights   = Math.max(1, Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000));
                  const deposit  = b.deposit_amount ?? Math.round(b.total_price * DEPOSIT_PERCENT / 100);
                  const balance  = b.total_price - deposit;
                  const st       = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
                  const expanded = expandedId === b.id;

                  return (
                    <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
                      {/* Header */}
                      <div className="flex gap-4 p-4">
                        {hotel?.cover_image && (
                          <img src={hotel.cover_image} alt={name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-foreground truncate">{name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${st.classes}`}>
                              {lang === "ar" ? st.ar : st.en}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: hotel?.stars ?? 3 }).map((_, si) => (
                              <Star key={si} className="w-3 h-3 fill-primary text-primary" />
                            ))}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {hotel?.city}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(b.check_in), "dd/MM/yyyy")} → {format(new Date(b.check_out), "dd/MM/yyyy")}
                            {" · "}{nights} {tx("ليالي", "nights")}
                          </div>
                        </div>
                      </div>

                      {/* Price summary */}
                      <div className="grid grid-cols-3 gap-px bg-border/30 border-t border-border/30">
                        <div className="bg-card p-3 text-center">
                          <p className="text-[10px] text-muted-foreground">{tx("الإجمالي", "Total")}</p>
                          <p className="font-bold text-foreground text-sm" dir="ltr">${b.total_price}</p>
                        </div>
                        <div className="bg-card p-3 text-center">
                          <p className="text-[10px] text-muted-foreground">{tx("مدفوع (10%)", "Paid (10%)")}</p>
                          <p className="font-bold text-primary text-sm" dir="ltr">${deposit}</p>
                        </div>
                        <div className="bg-card p-3 text-center">
                          <p className="text-[10px] text-muted-foreground">{tx("عند الوصول (90%)", "On Arrival (90%)")}</p>
                          <p className="font-bold text-foreground text-sm" dir="ltr">${balance}</p>
                        </div>
                      </div>

                      {/* Expand toggle */}
                      <button onClick={() => setExpandedId(expanded ? null : b.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-3 border-t border-border/50 text-xs text-primary font-medium hover:bg-muted/50 transition">
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {expanded ? tx("إخفاء التفاصيل", "Hide Details") : tx("عرض التفاصيل والقسيمة", "Show Details & Voucher")}
                      </button>
                      
                      {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-border/50">
                          <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-[10px] text-muted-foreground">{tx("نوع الغرفة", "Room Type")}</p>
                                <p className="font-medium text-foreground">{roomName}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground">{tx("الضيف", "Guest")}</p>
                                <p className="font-medium text-foreground">{b.guest_first_name} {b.guest_last_name}</p>
                              </div>
                              {b.guest_phone && (
                                <div>
                                  <p className="text-[10px] text-muted-foreground">{tx("الهاتف", "Phone")}</p>
                                  <p className="font-medium text-foreground">{b.guest_phone}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-[10px] text-muted-foreground">{tx("تاريخ الحجز", "Booked On")}</p>
                                <p className="font-medium text-foreground">{format(new Date(b.created_at), "dd/MM/yyyy HH:mm")}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground">{tx("عنوان الفندق", "Hotel Address")}</p>
                                <p className="font-medium text-foreground">{hotel?.address || hotel?.city}</p>
                              </div>
                              {b.special_requests && (
                                <div className="col-span-2">
                                  <p className="text-[10px] text-muted-foreground">{tx("طلبات خاصة", "Special Requests")}</p>
                                  <p className="font-medium text-foreground">{b.special_requests}</p>
                                </div>
                              )}
                            </div>
                            {b.transaction_hash && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground">{tx("رقم المعاملة", "Transaction ID")}</p>
                                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-xs font-mono text-foreground">
                                  <span className="truncate">{b.transaction_hash}</span>
                                  <button onClick={() => copy(b.transaction_hash, b.id)} className="shrink-0 text-primary hover:opacity-70 transition">
                                    {copiedId === b.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                            )}
                            {/* QR Voucher */}
                            <div className="text-center space-y-3 pt-2">
                              <p className="text-sm font-semibold text-foreground">{tx("القسيمة الرقمية", "Digital Booking Voucher")}</p>
                              <div className="inline-block bg-card p-3 rounded-lg border border-border/50">
                                <QRCodeSVG value={`NAITY-BOOKING:${b.id}`} size={120} level="H" />
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {tx("أظهر هذه القسيمة عند تسجيل الوصول في الفندق", "Show this voucher at hotel check-in")}
                              </p>
                              <p className="text-xs font-mono text-primary font-bold">{b.id.slice(0,8).toUpperCase()}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </Layout>
  );
}
