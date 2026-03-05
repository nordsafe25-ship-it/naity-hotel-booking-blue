import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, UserPlus, Trash2 } from "lucide-react";

const AdminManagers = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [hotelId, setHotelId] = useState("");

  const { data: managers, isLoading } = useQuery({
    queryKey: ["admin-managers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*, profiles:user_id(full_name, email)")
        .eq("role", "hotel_manager");
      if (error) throw error;
      return data;
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
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Assign hotel_manager role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: "hotel_manager" as const,
      });
      if (roleError) throw roleError;

      // Assign hotel
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
      toast.success("تم إنشاء حساب مدير الفندق");
      setOpen(false);
      setEmail("");
      setPassword("");
      setFullName("");
      setHotelId("");
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
      toast.success("تم إزالة مدير الفندق");
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">مدراء الفنادق</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-cta gap-2"><UserPlus className="w-4 h-4" /> إضافة مدير</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة مدير فندق جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createManager.mutate(); }} className="space-y-4">
                <div>
                  <Label>الاسم الكامل</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label>كلمة المرور</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <div>
                  <Label>الفندق</Label>
                  <Select value={hotelId} onValueChange={setHotelId}>
                    <SelectTrigger><SelectValue placeholder="اختر فندق" /></SelectTrigger>
                    <SelectContent>
                      {hotels?.map((h) => (
                        <SelectItem key={h.id} value={h.id}>{h.name_ar} ({h.name_en})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full gradient-cta" disabled={createManager.isPending}>
                  {createManager.isPending ? "جاري الإنشاء..." : "إنشاء حساب"}
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
                    <h3 className="font-semibold text-foreground">{profile?.full_name || "بدون اسم"}</h3>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => removeManager.mutate(m.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
            {managers?.length === 0 && (
              <p className="text-center text-muted-foreground py-12">لا يوجد مدراء فنادق. أضف مديراً جديداً!</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminManagers;
