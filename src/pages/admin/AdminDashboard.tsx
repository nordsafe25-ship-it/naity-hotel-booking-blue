import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Hotel, BookOpen, Users, DollarSign } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) => (
  <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-primary-foreground" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { data: hotelsCount } = useQuery({
    queryKey: ["admin-hotels-count"],
    queryFn: async () => {
      const { count } = await supabase.from("hotels").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: bookingsCount } = useQuery({
    queryKey: ["admin-bookings-count"],
    queryFn: async () => {
      const { count } = await supabase.from("bookings").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: managersCount } = useQuery({
    queryKey: ["admin-managers-count"],
    queryFn: async () => {
      const { count } = await supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "hotel_manager");
      return count ?? 0;
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Hotel} label="الفنادق" value={hotelsCount ?? 0} color="gradient-primary" />
          <StatCard icon={BookOpen} label="الحجوزات" value={bookingsCount ?? 0} color="bg-secondary" />
          <StatCard icon={Users} label="مدراء الفنادق" value={managersCount ?? 0} color="bg-accent" />
          <StatCard icon={DollarSign} label="الإيرادات" value="$0" color="gradient-cta" />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
