import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BedDouble, Wifi, WifiOff } from "lucide-react";

const HotelRoomsTab = ({ hotelId }: { hotelId: string }) => {
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name_ar: "", name_en: "", price_per_night: 0, max_guests: 2, total_rooms: 1,
  });

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["hotel-rooms", hotelId],
    queryFn: async () => {
      const { data } = await supabase.from("room_categories").select("*").eq("hotel_id", hotelId).order("price_per_night");
      return data ?? [];
    },
  });

  const { data: syncSettings } = useQuery({
    queryKey: ["hotel-sync", hotelId],
    queryFn: async () => {
      const { data } = await supabase.from("local_sync_settings").select("*").eq("hotel_id", hotelId).maybeSingle();
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, hotel_id: hotelId };
      if (editing) {
        const { error } = await supabase.from("room_categories").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("room_categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-rooms", hotelId] });
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
      queryClient.invalidateQueries({ queryKey: ["hotel-rooms", hotelId] });
      toast.success(lang === "ar" ? "تم الحذف" : "Deleted");
    },
  });

  const resetForm = () => {
    setForm({ name_ar: "", name_en: "", price_per_night: 0, max_guests: 2, total_rooms: 1 });
    setEditing(null);
  };

  const isSynced = syncSettings?.is_active && syncSettings?.last_heartbeat_at &&
    (Date.now() - new Date(syncSettings.last_heartbeat_at).getTime()) < 5 * 60 * 1000;

  return (
    <div className="space-y-6">
      {/* Sync Status Banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
        isSynced
          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
          : "bg-muted border-border/50"
      }`}>
        {isSynced ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-muted-foreground" />}
        <div>
          <p className="text-sm font-medium text-foreground">
            {isSynced
              ? (lang === "ar" ? "متصل بالنظام المحلي" : "Connected to Local System")
              : (lang === "ar" ? "غير متصل بالنظام المحلي" : "Not Connected to Local System")}
          </p>
          <p className="text-xs text-muted-foreground">
            {syncSettings?.last_heartbeat_at
              ? `${lang === "ar" ? "آخر اتصال: " : "Last heartbeat: "}${new Date(syncSettings.last_heartbeat_at).toLocaleString()}`
              : (lang === "ar" ? "لم يتم الاتصال بعد" : "No heartbeat received yet")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-lg">
          {lang === "ar" ? "فئات الغرف" : "Room Categories"}
        </h3>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-cta gap-2" size="sm">
              <Plus className="w-4 h-4" /> {lang === "ar" ? "إضافة فئة" : "Add Room"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? (lang === "ar" ? "تعديل الفئة" : "Edit Room") : (lang === "ar" ? "إضافة فئة جديدة" : "Add Room Category")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{lang === "ar" ? "الاسم (عربي)" : "Name (AR)"}</Label>
                  <Input value={form.name_ar} onChange={(e) => setForm(f => ({ ...f, name_ar: e.target.value }))} required />
                </div>
                <div>
                  <Label>Name (EN)</Label>
                  <Input value={form.name_en} onChange={(e) => setForm(f => ({ ...f, name_en: e.target.value }))} required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{lang === "ar" ? "السعر/ليلة ($)" : "Price/Night ($)"}</Label>
                  <Input type="number" min={0} value={form.price_per_night} onChange={(e) => setForm(f => ({ ...f, price_per_night: +e.target.value }))} required />
                </div>
                <div>
                  <Label>{lang === "ar" ? "الضيوف" : "Max Guests"}</Label>
                  <Input type="number" min={1} value={form.max_guests} onChange={(e) => setForm(f => ({ ...f, max_guests: +e.target.value }))} />
                </div>
                <div>
                  <Label>{lang === "ar" ? "الغرف" : "Total Rooms"}</Label>
                  <Input type="number" min={1} value={form.total_rooms} onChange={(e) => setForm(f => ({ ...f, total_rooms: +e.target.value }))} />
                </div>
              </div>
              <Button type="submit" className="w-full gradient-cta" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "..." : editing ? (lang === "ar" ? "تحديث" : "Update") : (lang === "ar" ? "إضافة" : "Add")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {rooms?.map((room) => (
            <div key={room.id} className="bg-card rounded-xl p-4 border border-border/50 shadow-card flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BedDouble className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{lang === "ar" ? room.name_ar : room.name_en}</h4>
                  <p className="text-xs text-muted-foreground">
                    {room.max_guests} {lang === "ar" ? "ضيوف" : "guests"} · {room.total_rooms} {lang === "ar" ? "غرف" : "rooms"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-foreground" dir="ltr">${room.price_per_night}</span>
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted text-xs">
                  {isSynced ? <Wifi className="w-3 h-3 text-green-600" /> : <WifiOff className="w-3 h-3 text-muted-foreground" />}
                  {isSynced ? (lang === "ar" ? "متزامن" : "Synced") : (lang === "ar" ? "غير متزامن" : "Not synced")}
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setEditing(room);
                  setForm({ name_ar: room.name_ar, name_en: room.name_en, price_per_night: room.price_per_night, max_guests: room.max_guests, total_rooms: room.total_rooms });
                  setOpen(true);
                }}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(room.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
          {rooms?.length === 0 && (
            <p className="text-center text-muted-foreground py-10">
              {lang === "ar" ? "لا توجد غرف بعد" : "No rooms yet. Add your first room category!"}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default HotelRoomsTab;
