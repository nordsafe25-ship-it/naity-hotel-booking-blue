import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import naityLogo from "@/assets/naity-logo.png";
import { DollarSign, BookOpen, LogOut, Plus, Trash2, Upload, Pencil, Globe, ImagePlus, Star, Calendar as CalendarIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, getDaysInMonth, getDay, endOfMonth } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

const HotelPanel = () => {
  const { user, signOut } = useAuth();
  const { lang, setLang } = useI18n();
  const queryClient = useQueryClient();

  const t = (ar: string, en: string) => lang === "ar" ? ar : en;

  const { data: hotel, isLoading: hotelLoading } = useQuery({
    queryKey: ["my-hotel", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("hotels").select("*").eq("manager_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Check if hotel has active sync
  const { data: syncSetting } = useQuery({
    queryKey: ["my-hotel-sync", hotel?.id],
    queryFn: async () => {
      const { data } = await supabase.from("local_sync_settings").select("is_active").eq("hotel_id", hotel!.id).maybeSingle();
      return data;
    },
    enabled: !!hotel?.id,
  });

  if (hotelLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">{t("لم يتم تعيينك لأي فندق بعد. تواصل مع الإدارة.", "You haven't been assigned to a hotel yet. Contact administration.")}</p>
        <Button variant="outline" onClick={signOut}>{t("تسجيل الخروج", "Sign Out")}</Button>
      </div>
    );
  }

  const showCalendar = (hotel as any).property_type === "apartment" || !syncSetting?.is_active;

  return (
    <div className="min-h-screen bg-background" dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className="bg-card border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={naityLogo} alt="Naity" className="h-8 w-auto" />
          <div>
            <h1 className="font-bold text-foreground">{lang === "ar" ? hotel.name_ar : hotel.name_en}</h1>
            <p className="text-xs text-muted-foreground">{t("لوحة إدارة الفندق", "Hotel Management Panel")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
            <Globe className="w-4 h-4 me-1" /> {lang === "ar" ? "English" : "العربية"}
          </Button>
          <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" /> {t("خروج", "Sign Out")}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="rooms" className="gap-2"><DollarSign className="w-4 h-4" /> {t("الغرف والأسعار", "Rooms & Pricing")}</TabsTrigger>
            <TabsTrigger value="photos" className="gap-2"><ImagePlus className="w-4 h-4" /> {t("الصور", "Photos")}</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2"><BookOpen className="w-4 h-4" /> {t("الحجوزات", "Reservations")}</TabsTrigger>
            {showCalendar && (
              <TabsTrigger value="calendar" className="gap-2"><CalendarIcon className="w-4 h-4" /> {t("التقويم", "Calendar")}</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="rooms">
            <RoomCategories hotelId={hotel.id} />
          </TabsContent>
          <TabsContent value="photos">
            <HotelPhotos hotelId={hotel.id} />
          </TabsContent>
          <TabsContent value="bookings">
            <HotelBookings hotelId={hotel.id} />
          </TabsContent>
          {showCalendar && (
            <TabsContent value="calendar">
              <AvailabilityCalendar hotelId={hotel.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

// ── Availability Calendar ────────────────────────────────
const AvailabilityCalendar = ({ hotelId }: { hotelId: string }) => {
  const { lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { data: blockedDates = [] } = useQuery({
    queryKey: ["blocked-dates", hotelId, currentMonth.toISOString()],
    queryFn: async () => {
      const start = format(currentMonth, "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const { data } = await supabase
        .from("blocked_dates")
        .select("blocked_date")
        .eq("hotel_id", hotelId)
        .gte("blocked_date", start)
        .lte("blocked_date", end);
      return data?.map(d => d.blocked_date) ?? [];
    },
  });

  const { data: bookedDates = [] } = useQuery({
    queryKey: ["booked-dates", hotelId, currentMonth.toISOString()],
    queryFn: async () => {
      const start = format(currentMonth, "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const { data } = await supabase
        .from("bookings")
        .select("check_in, check_out")
        .eq("hotel_id", hotelId)
        .in("status", ["confirmed", "active"])
        .lte("check_in", end)
        .gte("check_out", start);
      const dates: string[] = [];
      data?.forEach(b => {
        const d = new Date(b.check_in);
        const out = new Date(b.check_out);
        while (d < out) {
          dates.push(format(d, "yyyy-MM-dd"));
          d.setDate(d.getDate() + 1);
        }
      });
      return dates;
    },
  });

  const toggleDate = async (dateStr: string) => {
    if (isBlocked(dateStr)) {
      await supabase.from("blocked_dates").delete().eq("hotel_id", hotelId).eq("blocked_date", dateStr);
    } else {
      await supabase.from("blocked_dates").insert({ hotel_id: hotelId, blocked_date: dateStr });
    }
    queryClient.invalidateQueries({ queryKey: ["blocked-dates", hotelId] });
  };

  const isBlocked = (dateStr: string) => blockedDates.includes(dateStr);
  const isBooked = (dateStr: string) => bookedDates.includes(dateStr);
  const isPast = (dateStr: string) => dateStr < format(new Date(), "yyyy-MM-dd");

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfWeek = getDay(currentMonth);
  const days: (string | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d), "yyyy-MM-dd"));
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          {tx("تقويم الإتاحة", "Availability Calendar")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {tx(
            "انقر على أي يوم لتحديده كمشغول (أحمر) أو متاح (أخضر). الأيام المحجوزة من الزبائن تظهر باللون البرتقالي.",
            "Click any day to mark it as occupied (red) or available (green). Days booked by guests appear in orange."
          )}
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          className="p-2 rounded-lg hover:bg-muted transition text-foreground"
        >
          ‹
        </button>
        <span className="font-semibold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          className="p-2 rounded-lg hover:bg-muted transition text-foreground"
        >
          ›
        </button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {(lang === "ar"
          ? ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"]
          : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        ).map(d => (
          <div key={d} className="text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((dateStr, idx) => {
          if (!dateStr) return <div key={`empty-${idx}`} />;
          const past = isPast(dateStr);
          const booked = isBooked(dateStr);
          const blocked = isBlocked(dateStr);
          const day = new Date(dateStr).getDate();

          let bgClass = "bg-green-100 hover:bg-green-200 text-green-800 border border-green-300";
          if (past) bgClass = "bg-muted text-muted-foreground opacity-40 cursor-not-allowed border border-border/30";
          if (booked) bgClass = "bg-orange-100 text-orange-700 border border-orange-300 cursor-default";
          if (blocked) bgClass = "bg-red-100 hover:bg-red-200 text-red-700 border border-red-300";

          return (
            <button
              key={dateStr}
              onClick={() => !past && !booked && toggleDate(dateStr)}
              className={`rounded-lg py-2 text-sm font-medium transition-all ${bgClass}`}
              title={booked ? tx("محجوز من زبون", "Booked by guest") : blocked ? tx("مشغول", "Occupied") : tx("متاح", "Available")}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-200 border border-green-300" />
          {tx("متاح", "Available")}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-200 border border-red-300" />
          {tx("مشغول (يدوي)", "Blocked (manual)")}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-200 border border-orange-300" />
          {tx("محجوز من زبون", "Guest booking")}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted border border-border/30" />
          {tx("ماضي", "Past")}
        </div>
      </div>
    </div>
  );
};

// ── Room Categories ────────────────────────────────
const RoomCategories = ({ hotelId }: { hotelId: string }) => {
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"room_categories"> | null>(null);
  const [form, setForm] = useState({ name_ar: "", name_en: "", price_per_night: 0, max_guests: 2, total_rooms: 1 });

  const t = (ar: string, en: string) => lang === "ar" ? ar : en;

  const { data: categories } = useQuery({
    queryKey: ["room-categories", hotelId],
    queryFn: async () => {
      const { data } = await supabase.from("room_categories").select("*").eq("hotel_id", hotelId).order("price_per_night");
      return data ?? [];
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
      queryClient.invalidateQueries({ queryKey: ["room-categories"] });
      toast.success(editing ? t("تم التحديث", "Updated") : t("تمت الإضافة", "Added"));
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
      queryClient.invalidateQueries({ queryKey: ["room-categories"] });
      toast.success(t("تم الحذف", "Deleted"));
    },
  });

  const resetForm = () => {
    setForm({ name_ar: "", name_en: "", price_per_night: 0, max_guests: 2, total_rooms: 1 });
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{t("فئات الغرف والأسعار", "Room Categories & Pricing")}</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-cta gap-2"><Plus className="w-4 h-4" /> {t("إضافة فئة", "Add Category")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? t("تعديل الفئة", "Edit Category") : t("إضافة فئة جديدة", "Add New Category")}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t("الاسم (عربي)", "Name (Arabic)")}</Label><Input value={form.name_ar} onChange={(e) => setForm(f => ({ ...f, name_ar: e.target.value }))} required /></div>
                <div><Label>Name (English)</Label><Input value={form.name_en} onChange={(e) => setForm(f => ({ ...f, name_en: e.target.value }))} required /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>{t("السعر/ليلة ($)", "Price/Night ($)")}</Label><Input type="number" min={0} value={form.price_per_night} onChange={(e) => setForm(f => ({ ...f, price_per_night: +e.target.value }))} required /></div>
                <div><Label>{t("الحد الأقصى للضيوف", "Max Guests")}</Label><Input type="number" min={1} value={form.max_guests} onChange={(e) => setForm(f => ({ ...f, max_guests: +e.target.value }))} /></div>
                <div><Label>{t("عدد الغرف", "Total Rooms")}</Label><Input type="number" min={1} value={form.total_rooms} onChange={(e) => setForm(f => ({ ...f, total_rooms: +e.target.value }))} /></div>
              </div>
              <Button type="submit" className="w-full gradient-cta" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "..." : editing ? t("تحديث", "Update") : t("إضافة", "Add")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {categories?.map((cat) => (
          <div key={cat.id} className="bg-card rounded-xl p-4 border border-border/50 shadow-card flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-foreground">{lang === "ar" ? cat.name_ar : cat.name_en}</h3>
              <p className="text-sm text-muted-foreground">
                {lang === "ar" ? cat.name_en : cat.name_ar} · {cat.max_guests} {t("ضيوف", "guests")} · {cat.total_rooms} {t("غرفة", "rooms")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-primary" dir="ltr">${cat.price_per_night}<span className="text-sm font-normal text-muted-foreground">/{t("ليلة", "night")}</span></span>
              <Button variant="outline" size="sm" onClick={() => {
                setEditing(cat);
                setForm({ name_ar: cat.name_ar, name_en: cat.name_en, price_per_night: cat.price_per_night, max_guests: cat.max_guests, total_rooms: cat.total_rooms });
                setOpen(true);
              }}><Pencil className="w-4 h-4" /></Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(cat.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {categories?.length === 0 && <p className="text-center text-muted-foreground py-8">{t("لا توجد فئات غرف. أضف فئة جديدة!", "No room categories yet. Add your first!")}</p>}
      </div>
    </div>
  );
};

// ── Hotel Photos ────────────────────────────────
const HotelPhotos = ({ hotelId }: { hotelId: string }) => {
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const t = (ar: string, en: string) => lang === "ar" ? ar : en;

  const { data: photos } = useQuery({
    queryKey: ["hotel-photos", hotelId],
    queryFn: async () => {
      const { data } = await supabase.from("hotel_photos").select("*").eq("hotel_id", hotelId).order("sort_order");
      return data ?? [];
    },
  });

  const { data: hotel } = useQuery({
    queryKey: ["hotel-cover", hotelId],
    queryFn: async () => {
      const { data } = await supabase.from("hotels").select("cover_image").eq("id", hotelId).single();
      return data;
    },
  });

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop();
      const path = `${hotelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("hotel-photos").upload(path, file);
      if (uploadError) { toast.error(uploadError.message); continue; }
      const { data: { publicUrl } } = supabase.storage.from("hotel-photos").getPublicUrl(path);
      await supabase.from("hotel_photos").insert({ hotel_id: hotelId, url: publicUrl, sort_order: (photos?.length ?? 0) });
    }
    queryClient.invalidateQueries({ queryKey: ["hotel-photos", hotelId] });
    setUploading(false);
    toast.success(t("تم رفع الصور بنجاح", "Photos uploaded successfully"));
  };

  const deletePhoto = async (photo: Tables<"hotel_photos">) => {
    const urlParts = photo.url.split("/hotel-photos/");
    if (urlParts[1]) await supabase.storage.from("hotel-photos").remove([urlParts[1]]);
    await supabase.from("hotel_photos").delete().eq("id", photo.id);
    queryClient.invalidateQueries({ queryKey: ["hotel-photos", hotelId] });
    toast.success(t("تم حذف الصورة", "Photo deleted"));
  };

  const setAsMain = async (url: string) => {
    await supabase.from("hotels").update({ cover_image: url }).eq("id", hotelId);
    queryClient.invalidateQueries({ queryKey: ["hotel-cover", hotelId] });
    toast.success(t("تم تعيين صورة الغلاف", "Main image set"));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">{t("صور الفندق", "Hotel Photos")}</h2>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files); }}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        <input type="file" accept="image/*" multiple onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); }} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-7 h-7 text-primary" />
          </div>
          <p className="font-semibold text-foreground">
            {uploading ? t("جارٍ الرفع...", "Uploading...") : t("اسحب الصور هنا أو انقر للرفع", "Drag & drop photos here, or click to upload")}
          </p>
          <p className="text-sm text-muted-foreground">{t("PNG, JPG, WEBP", "PNG, JPG, WEBP")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos?.map((photo) => {
          const isMain = hotel?.cover_image === photo.url;
          return (
            <div key={photo.id} className={`relative group rounded-xl overflow-hidden border-2 transition-colors ${isMain ? "border-primary" : "border-border/50 hover:border-border"}`}>
              <img src={photo.url} alt="" className="w-full h-40 object-cover" />
              {isMain && (
                <div className="absolute top-2 start-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {t("رئيسية", "Main")}
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!isMain && (
                  <Button size="sm" variant="secondary" onClick={() => setAsMain(photo.url)} className="text-xs">
                    <Star className="w-3 h-3 me-1" /> {t("تعيين كرئيسية", "Set as Main")}
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => deletePhoto(photo)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {photos?.length === 0 && (
        <p className="text-center text-muted-foreground py-12">{t("لا توجد صور. ارفع صور فندقك!", "No photos yet. Upload your hotel photos!")}</p>
      )}
    </div>
  );
};

// ── Hotel Bookings ────────────────────────────────
const HotelBookings = ({ hotelId }: { hotelId: string }) => {
  const { lang } = useI18n();

  const t = (ar: string, en: string) => lang === "ar" ? ar : en;

  const { data: bookings } = useQuery({
    queryKey: ["hotel-bookings", hotelId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*, room_categories(name_ar, name_en)")
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">{t("حجوزات فندقك", "Your Hotel Reservations")}</h2>
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-start p-3 font-medium text-muted-foreground">{t("الضيف", "Guest")}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{t("الغرفة", "Room")}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{t("الوصول", "Check-in")}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{t("المغادرة", "Check-out")}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{t("المبلغ", "Total")}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{t("الحالة", "Status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings?.map((b) => (
                <tr key={b.id} className="hover:bg-muted/50">
                  <td className="p-3 text-foreground">{b.guest_first_name} {b.guest_last_name}</td>
                  <td className="p-3 text-foreground">{lang === "ar" ? (b.room_categories as any)?.name_ar : (b.room_categories as any)?.name_en}</td>
                  <td className="p-3 text-foreground">{b.check_in}</td>
                  <td className="p-3 text-foreground">{b.check_out}</td>
                  <td className="p-3 font-medium text-foreground" dir="ltr">${b.total_price}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      b.status === "confirmed" ? "bg-green-100 text-green-800" :
                      b.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      b.status === "checked_in" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                    }`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bookings?.length === 0 && <p className="text-center text-muted-foreground py-12">{t("لا توجد حجوزات حتى الآن", "No reservations yet")}</p>}
      </div>
    </div>
  );
};

export default HotelPanel;
