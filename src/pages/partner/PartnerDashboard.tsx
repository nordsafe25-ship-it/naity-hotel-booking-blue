import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, DollarSign, TrendingUp, LogOut, Download, Search } from "lucide-react";
import naityLogo from "@/assets/naity-logo.png";

type DateRange = "this_month" | "last_month" | "last_3" | "all" | "custom";

const formatDate = (d: string) => {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
};

const nightsBetween = (a: string, b: string) => {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(diff / 86400000));
};

const statusStyle: Record<string, string> = {
  confirmed: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400",
  completed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
  active: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
  checked_in: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400",
};

const PartnerDashboard = () => {
  const { user, signOut } = useAuth();
  const { lang, setLang } = useI18n();
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [partner, setPartner] = useState<any>(null);
  const [hotels, setHotels] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [noHotels, setNoHotels] = useState(false);

  const [range, setRange] = useState<DateRange>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const getDateRange = (): { from: string; to: string } | null => {
    const now = new Date();
    if (range === "this_month") {
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      return { from, to };
    }
    if (range === "last_month") {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
      return { from, to };
    }
    if (range === "last_3") {
      const from = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      const to = now.toISOString();
      return { from, to };
    }
    if (range === "custom" && customFrom && customTo) {
      return { from: new Date(customFrom).toISOString(), to: new Date(customTo + "T23:59:59").toISOString() };
    }
    return null; // all time
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      // 1. Get partner link
      const { data: pu } = await supabase
        .from("partner_users")
        .select("partner_id, tech_partners(id, name, name_ar, commission_rate)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!pu || !pu.tech_partners) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      const tp = pu.tech_partners as any;
      setPartner(tp);

      // 2. Hotels
      const { data: hData } = await supabase
        .from("hotels")
        .select("id, name_ar, name_en, city")
        .eq("tech_partner_id", tp.id)
        .eq("is_active", true);
      const hList = hData ?? [];
      setHotels(hList);

      if (!hList.length) { setLoading(false); setNoHotels(true); return; }

      // 3. Bookings
      const hotelIds = hList.map(h => h.id);
      let q = supabase
        .from("bookings")
        .select("id, created_at, check_in, check_out, guests_count, deposit_amount, total_price, status, guest_first_name, guest_last_name, guest_email, guest_phone, hotel_id, room_category_id, hotels(name_ar, name_en), room_categories(name_ar, name_en)")
        .in("hotel_id", hotelIds)
        .in("status", ["confirmed", "active", "completed", "checked_in"])
        .order("created_at", { ascending: false });

      const dr = getDateRange();
      if (dr) {
        q = q.gte("created_at", dr.from).lte("created_at", dr.to);
      }

      const { data: bData } = await q;
      setBookings(bData ?? []);
      setPage(0);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, range, customFrom, customTo]);

  const commissionRate = partner?.commission_rate ?? 0;

  const filtered = useMemo(() => {
    if (!searchQ.trim()) return bookings;
    const q = searchQ.toLowerCase();
    return bookings.filter(b =>
      `${b.guest_first_name} ${b.guest_last_name}`.toLowerCase().includes(q) ||
      b.guest_email?.toLowerCase().includes(q)
    );
  }, [bookings, searchQ]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const totalDeposit = bookings.reduce((s, b) => s + (b.deposit_amount ?? 0), 0);
  const totalGuests = bookings.reduce((s, b) => s + (b.guests_count ?? 0), 0);
  const myEarnings = totalDeposit * commissionRate / 100;

  // Hotels breakdown
  const hotelBreakdown = useMemo(() => {
    const map: Record<string, { name: string; city: string; count: number; deposit: number }> = {};
    for (const h of hotels) {
      map[h.id] = { name: lang === "ar" ? h.name_ar : h.name_en, city: h.city, count: 0, deposit: 0 };
    }
    for (const b of bookings) {
      if (map[b.hotel_id]) {
        map[b.hotel_id].count += 1;
        map[b.hotel_id].deposit += b.deposit_amount ?? 0;
      }
    }
    return Object.values(map);
  }, [hotels, bookings, lang]);

  const exportCSV = () => {
    const headers = [
      lang === "ar" ? "التاريخ" : "Date",
      lang === "ar" ? "اسم الزبون" : "Guest Name",
      lang === "ar" ? "البريد" : "Email",
      lang === "ar" ? "رقم الهاتف" : "Phone",
      lang === "ar" ? "الفندق" : "Hotel",
      lang === "ar" ? "الغرفة" : "Room",
      lang === "ar" ? "تسجيل الوصول" : "Check-in",
      lang === "ar" ? "تسجيل المغادرة" : "Check-out",
      lang === "ar" ? "الليالي" : "Nights",
      lang === "ar" ? "عدد الضيوف" : "Guests",
      lang === "ar" ? "العربون ($)" : "Deposit ($)",
      lang === "ar" ? "مستحقاتك ($)" : "Your Earnings ($)",
      lang === "ar" ? "الحالة" : "Status",
    ];
    const rows = filtered.map(b => {
      const hotel = b.hotels as any;
      const room = b.room_categories as any;
      return [
        formatDate(b.created_at),
        `${b.guest_first_name} ${b.guest_last_name}`,
        b.guest_email,
        b.guest_phone ?? "",
        lang === "ar" ? hotel?.name_ar : hotel?.name_en,
        lang === "ar" ? room?.name_ar : room?.name_en,
        formatDate(b.check_in),
        formatDate(b.check_out),
        nightsBetween(b.check_in, b.check_out),
        b.guests_count,
        (b.deposit_amount ?? 0).toFixed(2),
        ((b.deposit_amount ?? 0) * commissionRate / 100).toFixed(2),
        b.status,
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `partner-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (unauthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p className="text-lg font-semibold">{lang === "ar" ? "غير مصرح" : "Unauthorized"}</p>
        <Button onClick={signOut} variant="outline">{lang === "ar" ? "تسجيل الخروج" : "Sign Out"}</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const partnerName = lang === "ar" && partner?.name_ar ? partner.name_ar : partner?.name;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={naityLogo} alt="Naity" className="h-8 w-auto" />
            <span className="text-lg font-bold text-foreground">{partnerName}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
              {lang === "ar" ? "EN" : "عربي"}
            </Button>
            <Button variant="outline" size="sm" onClick={signOut} className="gap-1.5">
              <LogOut className="w-4 h-4" />
              {lang === "ar" ? "خروج" : "Sign Out"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {([
            ["this_month", lang === "ar" ? "هذا الشهر" : "This Month"],
            ["last_month", lang === "ar" ? "الشهر الماضي" : "Last Month"],
            ["last_3", lang === "ar" ? "آخر 3 أشهر" : "Last 3 Months"],
            ["all", lang === "ar" ? "كل الوقت" : "All Time"],
          ] as [DateRange, string][]).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={range === key ? "default" : "outline"}
              onClick={() => setRange(key)}
            >
              {label}
            </Button>
          ))}
          <div className="flex items-center gap-2">
            <Input type="date" className="w-36 h-9" value={customFrom} onChange={e => { setCustomFrom(e.target.value); setRange("custom"); }} />
            <Input type="date" className="w-36 h-9" value={customTo} onChange={e => { setCustomTo(e.target.value); setRange("custom"); }} />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{lang === "ar" ? "إجمالي الحجوزات" : "Total Bookings"}</p>
                <p className="text-2xl font-bold text-foreground">{bookings.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{lang === "ar" ? "إجمالي الضيوف" : "Total Guests"}</p>
                <p className="text-2xl font-bold text-foreground">{totalGuests}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{lang === "ar" ? "مجموع العربونات" : "Total Deposits"}</p>
                <p className="text-2xl font-bold text-foreground">${totalDeposit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground border-primary">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm opacity-80">{lang === "ar" ? "مستحقاتك 💰" : "Your Earnings 💰"}</p>
                <p className="text-2xl font-bold">${myEarnings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs opacity-70">
                  {lang === "ar" ? `بنسبة ${commissionRate}% من العربون` : `${commissionRate}% of deposit`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hotels Breakdown */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="text-lg font-bold text-foreground">
              {lang === "ar" ? "تفصيل حسب الفندق" : "Hotels Breakdown"}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/40">
                  <th className="text-start px-5 py-3 font-semibold text-muted-foreground">{lang === "ar" ? "الفندق" : "Hotel"}</th>
                  <th className="text-start px-5 py-3 font-semibold text-muted-foreground">{lang === "ar" ? "المدينة" : "City"}</th>
                  <th className="text-start px-5 py-3 font-semibold text-muted-foreground">{lang === "ar" ? "عدد الحجوزات" : "Bookings"}</th>
                  <th className="text-start px-5 py-3 font-semibold text-muted-foreground">{lang === "ar" ? "مجموع العربونات" : "Deposits"}</th>
                  <th className="text-start px-5 py-3 font-semibold text-muted-foreground">{lang === "ar" ? "مستحقاتك" : "Your Earnings"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {hotelBreakdown.map((h, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{h.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{h.city}</td>
                    <td className="px-5 py-3 text-foreground">{h.count}</td>
                    <td className="px-5 py-3 text-foreground">${h.deposit.toFixed(2)}</td>
                    <td className="px-5 py-3 font-semibold text-primary">${(h.deposit * commissionRate / 100).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-muted/60 font-bold">
                  <td className="px-5 py-3 text-foreground" colSpan={2}>{lang === "ar" ? "المجموع" : "Total"}</td>
                  <td className="px-5 py-3 text-foreground">{bookings.length}</td>
                  <td className="px-5 py-3 text-foreground">${totalDeposit.toFixed(2)}</td>
                  <td className="px-5 py-3 text-primary">${myEarnings.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground">
              {lang === "ar" ? "تفاصيل الزبائن" : "Customer Details"}
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute top-2.5 start-3 text-muted-foreground" />
                <Input
                  className="ps-9 h-9 w-56"
                  placeholder={lang === "ar" ? "بحث بالاسم أو البريد..." : "Search name or email..."}
                  value={searchQ}
                  onChange={e => { setSearchQ(e.target.value); setPage(0); }}
                />
              </div>
              <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
                <Download className="w-4 h-4" />
                {lang === "ar" ? "تصدير CSV" : "Export CSV"}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/40">
                  {[
                    lang === "ar" ? "التاريخ" : "Date",
                    lang === "ar" ? "اسم الزبون" : "Guest",
                    lang === "ar" ? "الفندق" : "Hotel",
                    lang === "ar" ? "الغرفة" : "Room",
                    lang === "ar" ? "الوصول" : "Check-in",
                    lang === "ar" ? "المغادرة" : "Check-out",
                    lang === "ar" ? "الليالي" : "Nights",
                    lang === "ar" ? "العربون ($)" : "Deposit ($)",
                    lang === "ar" ? "مستحقاتك ($)" : "Earnings ($)",
                    lang === "ar" ? "الحالة" : "Status",
                  ].map(h => (
                    <th key={h} className="text-start px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paged.map(b => {
                  const hotel = b.hotels as any;
                  const room = b.room_categories as any;
                  const dep = b.deposit_amount ?? 0;
                  return (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(b.created_at)}</td>
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{b.guest_first_name} {b.guest_last_name}</td>
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">{lang === "ar" ? hotel?.name_ar : hotel?.name_en}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{lang === "ar" ? room?.name_ar : room?.name_en}</td>
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatDate(b.check_in)}</td>
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatDate(b.check_out)}</td>
                      <td className="px-4 py-3 text-foreground">{nightsBetween(b.check_in, b.check_out)}</td>
                      <td className="px-4 py-3 text-foreground font-medium">${dep.toFixed(2)}</td>
                      <td className="px-4 py-3 font-semibold text-primary">${(dep * commissionRate / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-semibold border ${statusStyle[b.status] ?? ""}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!paged.length && (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-muted-foreground">
                      {lang === "ar" ? "لا توجد حجوزات" : "No bookings found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {lang === "ar" ? `صفحة ${page + 1} من ${totalPages}` : `Page ${page + 1} of ${totalPages}`}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  {lang === "ar" ? "السابق" : "Previous"}
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  {lang === "ar" ? "التالي" : "Next"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PartnerDashboard;
