import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ReservationDetail from "@/components/admin/ReservationDetail";
import { Search, Eye } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

const syncColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  sent_to_local: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const AdminBookings = () => {
  const { lang } = useI18n();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings", statusFilter, paymentFilter],
    queryFn: async () => {
      let q = supabase
        .from("bookings")
        .select("*, hotels(name_ar, name_en), room_categories(name_ar, name_en)")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (paymentFilter !== "all") q = q.eq("payment_status", paymentFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const filteredBookings = bookings?.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.guest_first_name.toLowerCase().includes(s) ||
      b.guest_last_name.toLowerCase().includes(s) ||
      b.guest_email.toLowerCase().includes(s) ||
      (b.passport_number && b.passport_number.toLowerCase().includes(s)) ||
      (b.transaction_hash && b.transaction_hash.toLowerCase().includes(s))
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          {lang === "ar" ? "سجل الحجوزات" : "Reservation Ledger"}
        </h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={lang === "ar" ? "بحث بالاسم، البريد، جواز السفر..." : "Search by name, email, passport..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "ar" ? "جميع الحالات" : "All Status"}</SelectItem>
              <SelectItem value="pending">{lang === "ar" ? "قيد الانتظار" : "Pending"}</SelectItem>
              <SelectItem value="confirmed">{lang === "ar" ? "مؤكد" : "Confirmed"}</SelectItem>
              <SelectItem value="cancelled">{lang === "ar" ? "ملغي" : "Cancelled"}</SelectItem>
              <SelectItem value="completed">{lang === "ar" ? "مكتمل" : "Completed"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "ar" ? "جميع المدفوعات" : "All Payments"}</SelectItem>
              <SelectItem value="unpaid">{lang === "ar" ? "غير مدفوع" : "Unpaid"}</SelectItem>
              <SelectItem value="paid">{lang === "ar" ? "مدفوع" : "Paid"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reservation Detail */}
        <ReservationDetail
          booking={selectedBooking}
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />

        {/* Table */}
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
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "الضيف" : "Guest"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "الفندق" : "Hotel"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "الوصول" : "Check-in"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "المبلغ" : "Total"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "العربون" : "Deposit"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "الحالة" : "Status"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "المزامنة" : "Sync"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredBookings?.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium text-foreground">{b.guest_first_name} {b.guest_last_name}</div>
                        <div className="text-xs text-muted-foreground">{b.guest_email}</div>
                      </td>
                      <td className="p-3 text-foreground">{lang === "ar" ? (b.hotels as any)?.name_ar : (b.hotels as any)?.name_en}</td>
                      <td className="p-3 text-foreground">{b.check_in}</td>
                      <td className="p-3 font-semibold text-foreground">${b.total_price}</td>
                      <td className="p-3">
                        <span className={`font-medium ${Number(b.deposit_amount) > 0 ? "text-green-700" : "text-muted-foreground"}`}>
                          ${b.deposit_amount || 0}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || ""}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${syncColors[b.sync_status || "pending"] || ""}`}>
                          {b.sync_status || "pending"}
                        </span>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(b)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredBookings?.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                {lang === "ar" ? "لا توجد حجوزات" : "No bookings found"}
              </p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
