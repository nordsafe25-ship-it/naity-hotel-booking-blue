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
import { Plus, Pencil, Trash2, BedDouble } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const AdminRooms = () => {
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const [selectedHotel, setSelectedHotel] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"room_categories"> | null>(null);
  const [form, setForm] = useState({
    hotel_id: "", name_ar: "", name_en: "", price_per_night: 0, max_guests: 2, total_rooms: 1,
  });

  const { data: hotels } = useQuery({
    queryKey: ["admin-hotels-list"],
    queryFn: async () => {
      const { data } = await supabase.from("hotels").select("id, name_ar, name_en");
      return data ?? [];
    },
  });

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["admin-rooms", selectedHotel],
    queryFn: async () => {
      let q = supabase.from("room_categories").select("*, hotels(name_ar, name_en)").order("price_per_night");
      if (selectedHotel !== "all") q = q.eq("hotel_id", selectedHotel);
      const { data } = await q;
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("room_categories").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("room_categories").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      toast.success(editing ? (lang === "ar" ? "تم التحديث" : "Updated") : (lang === "ar" ? "تمت الإضافة" : "Added"));
      setOpen(false);
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("room_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      toast.success(lang === "ar" ? "تم الحذف" : "Deleted");
    },
  });

  const updateAvailability = useMutation({
    mutationFn: async ({ id, total_rooms }: { id: string; total_rooms: number }) => {
      const { error } = await supabase.from("room_categories").update({ total_rooms }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      toast.success(lang === "ar" ? "تم تحديث التوفر" : "Availability updated");
    },
  });

  const resetForm = () => {
    setForm({ hotel_id: "", name_ar: "", name_en: "", price_per_night: 0, max_guests: 2, total_rooms: 1 });
    setEditing(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {lang === "ar" ? "المخزون والغرف" : "Inventory Control"}
          </h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-cta gap-2"><Plus className="w-4 h-4" /> {lang === "ar" ? "إضافة فئة" : "Add Room"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? (lang === "ar" ? "تعديل الفئة" : "Edit Room") : (lang === "ar" ? "إضافة فئة جديدة" : "Add Room Category")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div>
                  <Label>{lang === "ar" ? "الفندق" : "Hotel"}</Label>
                  <Select value={form.hotel_id} onValueChange={(v) => setForm(f => ({ ...f, hotel_id: v }))}>
                    <SelectTrigger><SelectValue placeholder={lang === "ar" ? "اختر فندق" : "Select hotel"} /></SelectTrigger>
                    <SelectContent>
                      {hotels?.map((h) => (
                        <SelectItem key={h.id} value={h.id}>{lang === "ar" ? h.name_ar : h.name_en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>{lang === "ar" ? "الاسم (عربي)" : "Name (AR)"}</Label><Input value={form.name_ar} onChange={(e) => setForm(f => ({ ...f, name_ar: e.target.value }))} required /></div>
                  <div><Label>Name (EN)</Label><Input value={form.name_en} onChange={(e) => setForm(f => ({ ...f, name_en: e.target.value }))} required /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>{lang === "ar" ? "السعر/ليلة ($)" : "Price/Night ($)"}</Label><Input type="number" min={0} value={form.price_per_night} onChange={(e) => setForm(f => ({ ...f, price_per_night: +e.target.value }))} required /></div>
                  <div><Label>{lang === "ar" ? "الضيوف" : "Guests"}</Label><Input type="number" min={1} value={form.max_guests} onChange={(e) => setForm(f => ({ ...f, max_guests: +e.target.value }))} /></div>
                  <div><Label>{lang === "ar" ? "الغرف" : "Rooms"}</Label><Input type="number" min={1} value={form.total_rooms} onChange={(e) => setForm(f => ({ ...f, total_rooms: +e.target.value }))} /></div>
                </div>
                <Button type="submit" className="w-full gradient-cta" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "..." : editing ? (lang === "ar" ? "تحديث" : "Update") : (lang === "ar" ? "إضافة" : "Add")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Hotel filter */}
        <div className="flex items-center gap-3">
          <Label className="text-sm shrink-0">{lang === "ar" ? "تصفية بالفندق:" : "Filter by hotel:"}</Label>
          <Select value={selectedHotel} onValueChange={setSelectedHotel}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "ar" ? "جميع الفنادق" : "All Hotels"}</SelectItem>
              {hotels?.map((h) => (
                <SelectItem key={h.id} value={h.id}>{lang === "ar" ? h.name_ar : h.name_en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Inventory Table */}
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
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "الفندق" : "Hotel"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "نوع الغرفة" : "Room Type"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "السعر" : "Price"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "الضيوف" : "Guests"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "الغرف المتاحة" : "Available"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rooms?.map((room) => (
                    <tr key={room.id} className="hover:bg-muted/50">
                      <td className="p-3 text-foreground font-medium">{lang === "ar" ? (room.hotels as any)?.name_ar : (room.hotels as any)?.name_en}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <BedDouble className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{lang === "ar" ? room.name_ar : room.name_en}</span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-foreground">${room.price_per_night}</td>
                      <td className="p-3 text-foreground">{room.max_guests}</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min={0}
                          value={room.total_rooms}
                          className="w-20 h-8 text-center"
                          onChange={(e) => updateAvailability.mutate({ id: room.id, total_rooms: +e.target.value })}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditing(room);
                            setForm({
                              hotel_id: room.hotel_id, name_ar: room.name_ar, name_en: room.name_en,
                              price_per_night: room.price_per_night, max_guests: room.max_guests, total_rooms: room.total_rooms,
                            });
                            setOpen(true);
                          }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(room.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rooms?.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                {lang === "ar" ? "لا توجد غرف. أضف فئة غرف جديدة!" : "No rooms yet. Add a room category!"}
              </p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRooms;
