import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Star, MapPin, Pencil, Trash2, AlertTriangle, ChevronRight, Clock } from "lucide-react";
import HeartbeatIndicator from "@/components/admin/HeartbeatIndicator";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { SYRIAN_MAIN_CITIES } from "@/lib/cities";

const AdminHotels = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"hotels"> | null>(null);
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;

  const [form, setForm] = useState<Partial<TablesInsert<"hotels">> & { property_type?: string }>({
    name_en: "", name_ar: "", city: "", stars: 3, description_en: "", description_ar: "", address: "",
    contact_phone: "", contact_email: "", property_type: "hotel",
  });

  const { data: hotels, isLoading } = useQuery({
    queryKey: ["admin-hotels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hotels").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: syncSettings } = useQuery({
    queryKey: ["admin-hotels-sync-timestamps"],
    queryFn: async () => {
      const { data } = await supabase.from("local_sync_settings").select("hotel_id, last_sync_at, is_active");
      return data ?? [];
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
      toast.success(editing ? tx("تم تحديث الفندق", "Hotel updated") : tx("تم إضافة الفندق", "Hotel added"));
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
      toast.success(tx("تم حذف الفندق", "Hotel deleted"));
    },
  });

  const toggleManualMode = useMutation({
    mutationFn: async ({ id, manual_mode }: { id: string; manual_mode: boolean }) => {
      const { error } = await supabase.from("hotels").update({ manual_mode }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hotels"] });
      toast.success(tx("تم تحديث وضع التشغيل", "Manual mode updated"));
    },
  });

  const resetForm = () => {
    setForm({ name_en: "", name_ar: "", city: "", stars: 3, description_en: "", description_ar: "", address: "", contact_phone: "", contact_email: "", property_type: "hotel" });
    setEditing(null);
  };

  const openEdit = (hotel: Tables<"hotels">) => {
    setEditing(hotel);
    setForm({
      name_en: hotel.name_en, name_ar: hotel.name_ar, city: hotel.city,
      stars: hotel.stars, description_en: hotel.description_en ?? "",
      description_ar: hotel.description_ar ?? "", address: hotel.address ?? "",
      contact_phone: hotel.contact_phone ?? "", contact_email: hotel.contact_email ?? "",
      property_type: (hotel as any).property_type ?? "hotel",
    });
    setOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {tx("إدارة الفنادق", "Hotel Management")}
          </h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-cta gap-2"><Plus className="w-4 h-4" /> {tx("إضافة فندق", "Add Hotel")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? tx("تعديل الفندق", "Edit Hotel") : tx("إضافة فندق جديد", "Add New Hotel")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form as any); }} className="space-y-4">
                {/* Property Type */}
                <div className="space-y-2">
                  <Label>{tx("نوع العقار", "Property Type")}</Label>
                  <div className="flex items-center gap-4">
                    {[
                      { val: "hotel", ar: "🏨 فندق", en: "🏨 Hotel" },
                      { val: "apartment", ar: "🏠 شقة سياحية", en: "🏠 Apartment" },
                    ].map(opt => (
                      <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="property_type_form"
                          checked={form.property_type === opt.val}
                          onChange={() => setForm(f => ({ ...f, property_type: opt.val }))}
                          className="accent-primary w-4 h-4"
                        />
                        <span className="text-sm text-foreground">{lang === "ar" ? opt.ar : opt.en}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{tx("الاسم (عربي)", "Name (Arabic)")}</Label>
                    <Input value={form.name_ar} onChange={(e) => setForm(f => ({ ...f, name_ar: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>Name (English)</Label>
                    <Input value={form.name_en} onChange={(e) => setForm(f => ({ ...f, name_en: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{tx("المدينة", "City")}</Label>
                    <select value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">{tx("اختر المدينة", "Select City")}</option>
                      {SYRIAN_MAIN_CITIES.map(c => (
                        <option key={c.en} value={c.en}>{lang === "ar" ? c.ar : c.en}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>{tx("النجوم", "Stars")}</Label>
                    <Input type="number" min={1} max={5} value={form.stars} onChange={(e) => setForm(f => ({ ...f, stars: +e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>{tx("العنوان", "Address")}</Label>
                  <Input value={form.address ?? ""} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{tx("هاتف التواصل", "Contact Phone")}</Label>
                    <Input value={(form as any).contact_phone ?? ""} onChange={(e) => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{tx("بريد التواصل", "Contact Email")}</Label>
                    <Input type="email" value={(form as any).contact_email ?? ""} onChange={(e) => setForm(f => ({ ...f, contact_email: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>{tx("الوصف (عربي)", "Description (Arabic)")}</Label>
                  <Textarea value={form.description_ar ?? ""} onChange={(e) => setForm(f => ({ ...f, description_ar: e.target.value }))} />
                </div>
                <div>
                  <Label>Description (English)</Label>
                  <Textarea value={form.description_en ?? ""} onChange={(e) => setForm(f => ({ ...f, description_en: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full gradient-cta" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "..." : editing ? tx("تحديث", "Update") : tx("إضافة", "Add")}
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
            {hotels?.map((hotel) => {
              const isApartment = (hotel as any).property_type === "apartment";
              const syncInfo = syncSettings?.find(s => s.hotel_id === hotel.id);
              const lastSync = syncInfo?.last_sync_at;
              const isStale = lastSync && (Date.now() - new Date(lastSync).getTime()) > 24 * 60 * 60 * 1000;

              return (
                <div key={hotel.id} className="bg-card rounded-xl p-4 border border-border/50 shadow-card hover:shadow-elevated transition-shadow cursor-pointer" onClick={() => navigate(`/admin/hotels/${hotel.id}`)}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {hotel.cover_image ? (
                          <img src={hotel.cover_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <MapPin className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <HeartbeatIndicator hotelId={hotel.id} />
                          <h3 className="font-semibold text-foreground">{lang === "ar" ? hotel.name_ar : hotel.name_en}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isApartment ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                            {isApartment ? tx("🏠 شقة", "🏠 Apartment") : tx("🏨 فندق", "🏨 Hotel")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{lang === "ar" ? hotel.name_en : hotel.name_ar} • {hotel.city}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: hotel.stars }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                            ))}
                          </div>
                          {/* Last Synced timestamp */}
                          {lastSync ? (
                            <span className={`flex items-center gap-1 text-[10px] font-medium ${isStale ? "text-destructive" : "text-muted-foreground"}`}>
                              <Clock className="w-3 h-3" />
                              {tx("آخر مزامنة:", "Synced:")}{" "}
                              {new Date(lastSync).toLocaleString(lang === "ar" ? "ar-SY" : "en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              {isStale && <span className="text-destructive ml-1">⚠️</span>}
                            </span>
                          ) : syncInfo ? (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {tx("لم تتم المزامنة بعد", "Never synced")}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                        <AlertTriangle className={`w-4 h-4 ${hotel.manual_mode ? "text-destructive" : "text-muted-foreground"}`} />
                        <span className="text-xs font-medium text-foreground">
                          {tx("وضع يدوي", "Manual")}
                        </span>
                        <Switch
                          checked={hotel.manual_mode ?? false}
                          onCheckedChange={(v) => toggleManualMode.mutate({ id: hotel.id, manual_mode: v })}
                        />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openEdit(hotel)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(hotel.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              );
            })}
            {hotels?.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                {tx("لا توجد فنادق. أضف فندقك الأول!", "No hotels yet. Add your first hotel!")}
              </p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminHotels;
