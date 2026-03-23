import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, BookOpen, DollarSign, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CompanyDashboard = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const tx = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const { data: companyLink } = useQuery({
    queryKey: ["company-user-link", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const companyId = companyLink?.company_id;

  const { data: company } = useQuery({
    queryKey: ["company-info", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("api_companies")
        .select("*")
        .eq("id", companyId!)
        .single();
      return data;
    },
    enabled: !!companyId,
  });

  const { data: hotels } = useQuery({
    queryKey: ["company-hotels", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("hotels")
        .select("*")
        .eq("company_id", companyId!);
      return data ?? [];
    },
    enabled: !!companyId,
  });

  const hotelIds = hotels?.map((h: any) => h.id) ?? [];

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["company-bookings", hotelIds],
    queryFn: async () => {
      if (hotelIds.length === 0) return [];
      const { data } = await supabase
        .from("bookings")
        .select("*, hotels(name_ar, name_en, city, company_commission_percent)")
        .in("hotel_id", hotelIds)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: hotelIds.length > 0,
  });

  if (!companyId) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">
            {tx("لا توجد شركة مرتبطة بحسابك", "No company linked to your account")}
          </p>
        </div>
      </Layout>
    );
  }

  const paidBookings = bookings?.filter((b: any) => b.payment_status === "paid") ?? [];
  const totalDeposits = paidBookings.reduce((s: number, b: any) => s + Number(b.deposit_amount || 0), 0);
  const companyEarnings = paidBookings.reduce((s: number, b: any) => {
    const commission = Number((b.hotels as any)?.company_commission_percent || 0);
    return s + Number(b.deposit_amount || 0) * 0.75 * (commission / 100);
  }, 0);

  const hotelSummary = hotels?.map((h: any) => {
    const hBookings = paidBookings.filter((b: any) => b.hotel_id === h.id);
    const hDeposits = hBookings.reduce((s: number, b: any) => s + Number(b.deposit_amount || 0), 0);
    const hEarning = hBookings.reduce((s: number, b: any) => s + Number(b.deposit_amount || 0) * 0.75 * (Number(h.company_commission_percent || 0) / 100), 0);
    return { ...h, bookingsCount: hBookings.length, deposits: hDeposits, earning: hEarning };
  }) ?? [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
        {/* Company info */}
        {company && (
          <div className="bg-card rounded-xl p-6 border border-border/50 flex items-center gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {lang === "ar" ? (company.name_ar || company.name) : company.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {lang === "ar" ? company.name : company.name_ar}
              </p>
            </div>
            <Badge variant={company.status === "active" ? "default" : "secondary"}>
              {company.status}
            </Badge>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{tx("عدد الفنادق", "Hotels Count")}</CardTitle>
              <Hotel className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-foreground">{hotels?.length ?? 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{tx("إجمالي الحجوزات", "Total Bookings")}</CardTitle>
              <BookOpen className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-foreground">{paidBookings.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{tx("إجمالي العرابين", "Total Deposits")}</CardTitle>
              <DollarSign className="w-5 h-5 text-amber-600" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-foreground">${totalDeposits.toFixed(2)}</div></CardContent>
          </Card>
          <Card className="border-green-300 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{tx("أرباح الشركة", "Company Earnings")}</CardTitle>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold text-green-600">${companyEarnings.toFixed(2)}</div></CardContent>
          </Card>
        </div>

        {/* Hotels table */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h2 className="font-semibold text-foreground">{tx("فنادق الشركة", "Company Hotels")}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-start p-3 font-medium text-muted-foreground">{tx("الفندق", "Hotel")}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{tx("المدينة", "City")}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{tx("النجوم", "Stars")}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{tx("العمولة %", "Commission %")}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{tx("الحجوزات", "Bookings")}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{tx("أرباح الشركة", "Earnings")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hotelSummary.map((h: any) => (
                  <tr key={h.id} className="hover:bg-muted/50">
                    <td className="p-3 text-foreground font-medium">{lang === "ar" ? h.name_ar : h.name_en}</td>
                    <td className="p-3 text-foreground">{h.city}</td>
                    <td className="p-3 text-foreground">{"⭐".repeat(h.stars)}</td>
                    <td className="p-3 text-foreground">{h.company_commission_percent}%</td>
                    <td className="p-3 text-foreground">{h.bookingsCount}</td>
                    <td className="p-3 text-green-600 font-semibold">${h.earning.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bookings table */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h2 className="font-semibold text-foreground">{tx("سجل الحجوزات", "Bookings Log")}</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("رقم الحجز", "Booking ID")}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("الفندق", "Hotel")}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("الوصول", "Check-in")}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("المغادرة", "Check-out")}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("العربون", "Deposit")}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("أرباح الشركة", "Company Earning")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings?.map((b: any) => {
                    const commission = Number((b.hotels as any)?.company_commission_percent || 0);
                    const earning = Number(b.deposit_amount || 0) * 0.75 * (commission / 100);
                    return (
                      <tr key={b.id} className="hover:bg-muted/50">
                        <td className="p-3 font-mono text-xs text-foreground">{b.id.slice(0, 8).toUpperCase()}</td>
                        <td className="p-3 text-foreground">{lang === "ar" ? (b.hotels as any)?.name_ar : (b.hotels as any)?.name_en}</td>
                        <td className="p-3 text-foreground">{b.check_in}</td>
                        <td className="p-3 text-foreground">{b.check_out}</td>
                        <td className="p-3 text-foreground">${b.deposit_amount || 0}</td>
                        <td className="p-3 text-green-600 font-semibold">${earning.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CompanyDashboard;
