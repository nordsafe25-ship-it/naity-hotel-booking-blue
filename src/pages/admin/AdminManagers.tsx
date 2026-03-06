import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";

const AdminManagers = () => {
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [hotelId, setHotelId] = useState("");

  const { data: managers, isLoading } = useQuery({
    queryKey: ["admin-managers"],
    queryFn: async () => {
      // First get hotel_manager roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("role", "hotel_manager");
      if (rolesError) throw rolesError;
      if (!roles?.length) return [];

      // Then fetch profiles for those user_ids
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      // Merge
      return roles.map(r => ({
        ...r,
        profiles: profiles?.find(p => p.user_id === r.user_id) || null,
      }));
    },
  });

  const { data: hotels } = useQuery({
    queryKey: ["admin-hotels-list"],
    queryFn: async () => {
      const { data } = await supabase.from("hotels").select("id, name_ar, name_en");
      return data ?? [];
    },
  });

  const createManager = useMutation({
    mutationFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: "hotel_manager" as const,
      });
      if (roleError) throw roleError;

      if (hotelId) {
        const { error: hotelError } = await supabase
          .from("hotels")
          .update({ manager_id: authData.user.id })
          .eq("id", hotelId);
        if (hotelError) throw hotelError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-managers"] });
      toast.success(lang === "ar" ? "تم إنشاء حساب مدير الفندق" : "Hotel manager created");
      setOpen(false);
      setEmail(""); setPassword(""); setFullName(""); setHotelId("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeManager = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-managers"] });
      toast.success(lang === "ar" ? "تم إزالة مدير الفندق" : "Manager removed");
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {lang === "ar" ? "مدراء الفنادق" : "Hotel Managers"}
          </h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-cta gap-2"><UserPlus className="w-4 h-4" /> {lang === "ar" ? "إضافة مدير" : "Add Manager"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{lang === "ar" ? "إضافة مدير فندق جديد" : "Add New Hotel Manager"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createManager.mutate(); }} className="space-y-4">
                <div>
                  <Label>{lang === "ar" ? "الاسم الكامل" : "Full Name"}</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <Label>{lang === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label>{lang === "ar" ? "كلمة المرور" : "Password"}</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <div>
                  <Label>{lang === "ar" ? "الفندق" : "Hotel"}</Label>
                  <Select value={hotelId} onValueChange={setHotelId}>
                    <SelectTrigger><SelectValue placeholder={lang === "ar" ? "اختر فندق" : "Select hotel"} /></SelectTrigger>
                    <SelectContent>
                      {hotels?.map((h) => (
                        <SelectItem key={h.id} value={h.id}>{lang === "ar" ? h.name_ar : h.name_en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full gradient-cta" disabled={createManager.isPending}>
                  {createManager.isPending ? "..." : (lang === "ar" ? "إنشاء حساب" : "Create Account")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {managers?.map((m) => {
              const profile = m.profiles as any;
              return (
                <div key={m.id} className="bg-card rounded-xl p-4 border border-border/50 shadow-card flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{profile?.full_name || (lang === "ar" ? "بدون اسم" : "No name")}</h3>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => removeManager.mutate(m.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
            {managers?.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                {lang === "ar" ? "لا يوجد مدراء فنادق. أضف مديراً جديداً!" : "No hotel managers yet. Add one!"}
              </p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminManagers;
