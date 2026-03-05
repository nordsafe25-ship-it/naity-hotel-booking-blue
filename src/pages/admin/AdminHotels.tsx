import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Star, MapPin, Pencil, Trash2 } from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

const AdminHotels = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"hotels"> | null>(null);
  const [form, setForm] = useState<Partial<TablesInsert<"hotels">>>({
    name_en: "", name_ar: "", city: "", stars: 3, description_en: "", description_ar: "", address: "",
  });

  const { data: hotels, isLoading } = useQuery({
    queryKey: ["admin-hotels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hotels").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<TablesInsert<"hotels">>) => {
      if (editing) {
        const { error } = await supabase.from("hotels").update(data).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hotels").insert(data as TablesInsert<"hotels">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hotels"] });
      toast.success(editing ? "تم تحديث الفندق" : "تم إضافة الفندق");
      setOpen(false);
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hotels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hotels"] });
      toast.success("تم حذف الفندق");
    },
  });

  const resetForm = () => {
    setForm({ name_en: "", name_ar: "", city: "", stars: 3, description_en: "", description_ar: "", address: "" });
    setEditing(null);
  };

  const openEdit = (hotel: Tables<"hotels">) => {
    setEditing(hotel);
    setForm({
      name_en: hotel.name_en, name_ar: hotel.name_ar, city: hotel.city,
      stars: hotel.stars, description_en: hotel.description_en ?? "",
      description_ar: hotel.description_ar ?? "", address: hotel.address ?? "",
    });
    setOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">إدارة الفنادق</h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-cta gap-2"><Plus className="w-4 h-4" /> إضافة فندق</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "تعديل الفندق" : "إضافة فندق جديد"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الاسم (عربي)</Label>
                    <Input value={form.name_ar} onChange={(e) => setForm(f => ({ ...f, name_ar: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>Name (English)</Label>
                    <Input value={form.name_en} onChange={(e) => setForm(f => ({ ...f, name_en: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>المدينة</Label>
                    <Input value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>النجوم</Label>
                    <Input type="number" min={1} max={5} value={form.stars} onChange={(e) => setForm(f => ({ ...f, stars: +e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>العنوان</Label>
                  <Input value={form.address ?? ""} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <Label>الوصف (عربي)</Label>
                  <Textarea value={form.description_ar ?? ""} onChange={(e) => setForm(f => ({ ...f, description_ar: e.target.value }))} />
                </div>
                <div>
                  <Label>Description (English)</Label>
                  <Textarea value={form.description_en ?? ""} onChange={(e) => setForm(f => ({ ...f, description_en: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full gradient-cta" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "جاري الحفظ..." : editing ? "تحديث" : "إضافة"}
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
            {hotels?.map((hotel) => (
              <div key={hotel.id} className="bg-card rounded-xl p-4 border border-border/50 shadow-card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    {hotel.cover_image ? (
                      <img src={hotel.cover_image} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <MapPin className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{hotel.name_ar}</h3>
                    <p className="text-sm text-muted-foreground">{hotel.name_en} • {hotel.city}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: hotel.stars }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(hotel)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(hotel.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {hotels?.length === 0 && (
              <p className="text-center text-muted-foreground py-12">لا توجد فنادق. أضف فندقك الأول!</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminHotels;
