import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

const AdminBookings = () => {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, hotels(name_ar, name_en), room_categories(name_ar, name_en)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">الحجوزات</h1>

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
                    <th className="text-right p-3 font-medium text-muted-foreground">الضيف</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">الفندق</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">الغرفة</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">الوصول</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">المغادرة</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">المبلغ</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">الحالة</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">الدفع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings?.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium text-foreground">{b.guest_first_name} {b.guest_last_name}</div>
                        <div className="text-xs text-muted-foreground">{b.guest_email}</div>
                      </td>
                      <td className="p-3 text-foreground">{(b.hotels as any)?.name_ar}</td>
                      <td className="p-3 text-foreground">{(b.room_categories as any)?.name_ar}</td>
                      <td className="p-3 text-foreground">{b.check_in}</td>
                      <td className="p-3 text-foreground">{b.check_out}</td>
                      <td className="p-3 font-medium text-foreground">${b.total_price}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || ""}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          b.payment_status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {b.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bookings?.length === 0 && (
              <p className="text-center text-muted-foreground py-12">لا توجد حجوزات حتى الآن</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
