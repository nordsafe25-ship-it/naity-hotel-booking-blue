import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, TrendingUp, AlertTriangle, Building2, UserCheck } from "lucide-react";

const AdminFinance = () => {
  const { lang } = useI18n();
  const tx = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-finance-bookings", dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase
        .from("bookings")
        .select("*, hotels(name_ar, name_en, company_id, company_commission_percent, sales_commission_percent, sales_name, api_companies:company_id(name, name_ar))")
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });
      if (dateFrom) q = q.gte("check_in", dateFrom);
      if (dateTo) q = q.lte("check_in", dateTo);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalDeposits = bookings?.reduce((s: number, b: any) => s + Number(b.deposit_amount || 0), 0) ?? 0;
  const mva = totalDeposits * 0.25;
  const afterTax = totalDeposits * 0.75;

  const companyPayouts = bookings?.reduce((s: number, b: any) => {
    const dep = Number(b.deposit_amount || 0) * 0.75;
    return s + dep * (Number((b.hotels as any)?.company_commission_percent || 0) / 100);
  }, 0) ?? 0;

  const salesPayouts = bookings?.reduce((s: number, b: any) => {
    const dep = Number(b.deposit_amount || 0) * 0.75;
    return s + dep * (Number((b.hotels as any)?.sales_commission_percent || 0) / 100);
  }, 0) ?? 0;

  const naityProfit = afterTax - companyPayouts - salesPayouts;

  // Grouped by company
  const companyMap = new Map<string, { name: string; hotels: Set<string>; deposits: number; payout: number }>();
  const salesMap = new Map<string, { hotels: Set<string>; deposits: number; payout: number }>();

  bookings?.forEach((b: any) => {
    const hotel = b.hotels as any;
    const dep = Number(b.deposit_amount || 0);
    const afterTaxDep = dep * 0.75;

    if (hotel?.company_id && hotel?.api_companies) {
      const key = hotel.company_id;
      const existing = companyMap.get(key) || { name: lang === "ar" ? (hotel.api_companies.name_ar || hotel.api_companies.name) : hotel.api_companies.name, hotels: new Set(), deposits: 0, payout: 0 };
      existing.hotels.add(b.hotel_id);
      existing.deposits += dep;
      existing.payout += afterTaxDep * (Number(hotel.company_commission_percent || 0) / 100);
      companyMap.set(key, existing);
    }

    if (hotel?.sales_name) {
      const key = hotel.sales_name;
      const existing = salesMap.get(key) || { hotels: new Set(), deposits: 0, payout: 0 };
      existing.hotels.add(b.hotel_id);
      existing.deposits += dep;
      existing.payout += afterTaxDep * (Number(hotel.sales_commission_percent || 0) / 100);
      salesMap.set(key, existing);
    }
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          {tx("التوزيع المالي", "Financial Report")}
        </h1>

        {/* Date filters */}
        <div className="flex flex-wrap gap-4">
          <div>
            <Label>{tx("من تاريخ", "From Date")}</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" />
          </div>
          <div>
            <Label>{tx("إلى تاريخ", "To Date")}</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-44" />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">{tx("إجمالي العرابين", "Total Deposits")}</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold text-foreground">${totalDeposits.toFixed(2)}</div></CardContent>
          </Card>
          <Card className="border-red-200">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">{tx("MVA النرويج (25%)", "Norway MVA (25%)")}</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold text-red-600">${mva.toFixed(2)}</div></CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">{tx("بعد الضريبة", "After Tax")}</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold text-blue-600">${afterTax.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">{tx("مدفوعات الشركات", "Company Payouts")}</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold text-foreground">${companyPayouts.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">{tx("مدفوعات Sales", "Sales Payouts")}</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold text-foreground">${salesPayouts.toFixed(2)}</div></CardContent>
          </Card>
          <Card className="border-green-300 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">{tx("صافي ربح Naity", "Naity Net Profit")}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">${naityProfit.toFixed(2)}</div></CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Detailed bookings table */}
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <h2 className="font-semibold text-foreground">{tx("تفاصيل الحجوزات", "Booking Details")}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-start p-3 font-medium text-muted-foreground">{tx("رقم", "ID")}</th>
                      <th className="text-start p-3 font-medium text-muted-foreground">{tx("الفندق", "Hotel")}</th>
                      <th className="text-start p-3 font-medium text-muted-foreground">{tx("التاريخ", "Date")}</th>
                      <th className="text-start p-3 font-medium text-muted-foreground">{tx("العربون", "Deposit")}</th>
                      <th className="text-start p-3 font-medium text-muted-foreground">MVA</th>
                      <th className="text-start p-3 font-medium text-muted-foreground">{tx("بعد الضريبة", "After Tax")}</th>
                      <th className="text-start p-3 font-medium text-muted-foreground">{tx("الشركة", "Company")}</th>
                      <th className="text-start p-3 font-medium text-muted-foreground">Sales</th>
                      <th className="text-start p-3 font-medium text-muted-foreground">{tx("ربح Naity", "Naity Profit")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bookings?.map((b: any) => {
                      const hotel = b.hotels as any;
                      const dep = Number(b.deposit_amount || 0);
                      const bMva = dep * 0.25;
                      const bAfterTax = dep * 0.75;
                      const compPct = Number(hotel?.company_commission_percent || 0);
                      const salesPct = Number(hotel?.sales_commission_percent || 0);
                      const compAmt = bAfterTax * (compPct / 100);
                      const salesAmt = bAfterTax * (salesPct / 100);
                      const profit = bAfterTax - compAmt - salesAmt;
                      const compName = hotel?.api_companies ? (lang === "ar" ? (hotel.api_companies.name_ar || hotel.api_companies.name) : hotel.api_companies.name) : "—";

                      return (
                        <tr key={b.id} className="hover:bg-muted/50">
                          <td className="p-3 font-mono text-xs">{b.id.slice(0, 8).toUpperCase()}</td>
                          <td className="p-3 text-foreground">{lang === "ar" ? hotel?.name_ar : hotel?.name_en}</td>
                          <td className="p-3 text-foreground">{b.check_in}</td>
                          <td className="p-3 text-foreground">${dep.toFixed(2)}</td>
                          <td className="p-3 text-red-600">${bMva.toFixed(2)}</td>
                          <td className="p-3 text-blue-600">${bAfterTax.toFixed(2)}</td>
                          <td className="p-3 text-foreground text-xs">{compName} ({compPct}%)</td>
                          <td className="p-3 text-foreground text-xs">{hotel?.sales_name || "—"} ({salesPct}%)</td>
                          <td className="p-3 text-green-600 font-semibold">${profit.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Company summary */}
            {companyMap.size > 0 && (
              <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/50 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">{tx("ملخص حسب الشركة", "Summary by Company")}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-start p-3 font-medium text-muted-foreground">{tx("الشركة", "Company")}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{tx("عدد الفنادق", "Hotels")}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{tx("إجمالي العرابين", "Total Deposits")}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{tx("مستحقات الشركة", "Company Payout")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {Array.from(companyMap.entries()).map(([key, val]) => (
                        <tr key={key} className="hover:bg-muted/50">
                          <td className="p-3 text-foreground font-medium">{val.name}</td>
                          <td className="p-3 text-foreground">{val.hotels.size}</td>
                          <td className="p-3 text-foreground">${val.deposits.toFixed(2)}</td>
                          <td className="p-3 text-foreground font-semibold">${val.payout.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sales summary */}
            {salesMap.size > 0 && (
              <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/50 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">{tx("ملخص حسب Sales", "Summary by Sales Person")}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-start p-3 font-medium text-muted-foreground">Sales</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{tx("عدد الفنادق", "Hotels")}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{tx("إجمالي العرابين", "Total Deposits")}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{tx("مستحقات Sales", "Sales Payout")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {Array.from(salesMap.entries()).map(([key, val]) => (
                        <tr key={key} className="hover:bg-muted/50">
                          <td className="p-3 text-foreground font-medium">{key}</td>
                          <td className="p-3 text-foreground">{val.hotels.size}</td>
                          <td className="p-3 text-foreground">${val.deposits.toFixed(2)}</td>
                          <td className="p-3 text-foreground font-semibold">${val.payout.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFinance;
