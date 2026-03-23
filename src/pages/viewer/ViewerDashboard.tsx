import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, DollarSign, Percent, TrendingUp } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  active: "bg-emerald-100 text-emerald-800",
  checked_in: "bg-indigo-100 text-indigo-800",
  expired: "bg-gray-100 text-gray-800",
};

const ViewerDashboard = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const tx = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const { data: profile } = useQuery({
    queryKey: ["viewer-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("profit_share_percent")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["viewer-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, hotels(name_ar, name_en, city), room_categories(name_ar, name_en)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalBookings = bookings?.length ?? 0;
  const totalDeposits = bookings
    ?.filter((b: any) => b.payment_status === "paid")
    .reduce((sum: number, b: any) => sum + Number(b.deposit_amount || 0), 0) ?? 0;
  const profitPercent = Number(profile?.profit_share_percent ?? 0);
  const earnings = totalDeposits * (profitPercent / 100);

  const summaryCards = [
    { title: tx("إجمالي الحجوزات", "Total Bookings"), value: totalBookings, icon: BookOpen, color: "text-primary" },
    { title: tx("إجمالي العرابين", "Total Deposits"), value: `$${totalDeposits.toFixed(2)}`, icon: DollarSign, color: "text-blue-600" },
    { title: tx("نسبة ربحك", "Your Share %"), value: `${profitPercent}%`, icon: Percent, color: "text-amber-600" },
    { title: tx("أرباحك", "Your Earnings"), value: `$${earnings.toFixed(2)}`, icon: TrendingUp, color: "text-green-600", highlight: true },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
        <h1 className="text-2xl font-bold text-foreground">
          {tx("لوحة المشاهدة", "Viewer Dashboard")}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, i) => (
            <Card key={i} className={card.highlight ? "border-green-300 bg-green-50/50 dark:bg-green-950/20" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.highlight ? "text-green-600 text-3xl" : "text-foreground"}`}>
                  {card.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("رقم الحجز", "Booking ID")}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("الفندق", "Hotel")}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("المدينة", "City")}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("الوصول", "Check-in")}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("المغادرة", "Check-out")}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("المجموع", "Total")}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("العربون", "Deposit")}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{tx("الحالة", "Status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings?.map((b: any) => (
                    <tr key={b.id} className="hover:bg-muted/50">
                      <td className="p-3 font-mono text-xs text-foreground">{b.id.slice(0, 8).toUpperCase()}</td>
                      <td className="p-3 text-foreground">{lang === "ar" ? b.hotels?.name_ar : b.hotels?.name_en}</td>
                      <td className="p-3 text-foreground">{b.hotels?.city}</td>
                      <td className="p-3 text-foreground">{b.check_in}</td>
                      <td className="p-3 text-foreground">{b.check_out}</td>
                      <td className="p-3 font-semibold text-foreground">${b.total_price}</td>
                      <td className="p-3 text-foreground">${b.deposit_amount || 0}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || ""}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bookings?.length === 0 && (
              <p className="text-center text-muted-foreground py-12">{tx("لا توجد حجوزات", "No bookings found")}</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ViewerDashboard;
