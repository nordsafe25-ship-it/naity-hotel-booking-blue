import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import naityLogo from "@/assets/naity-logo.png";
import { Hotel, Image, DollarSign, BookOpen, LogOut, Plus, Trash2, Upload, Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

const HotelPanel = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  // Get manager's hotel
  const { data: hotel, isLoading: hotelLoading } = useQuery({
    queryKey: ["my-hotel", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("hotels").select("*").eq("manager_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
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
        <p className="text-muted-foreground">لم يتم تعيينك لأي فندق بعد. تواصل مع الإدارة.</p>
        <Button variant="outline" onClick={signOut}>تسجيل الخروج</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={naityLogo} alt="Naity" className="h-8 w-auto" />
          <div>
            <h1 className="font-bold text-foreground">{hotel.name_ar}</h1>
            <p className="text-xs text-muted-foreground">لوحة إدارة الفندق</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
          <LogOut className="w-4 h-4" /> خروج
        </Button>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="rooms" className="gap-2"><DollarSign className="w-4 h-4" /> الغرف والأسعار</TabsTrigger>
            <TabsTrigger value="photos" className="gap-2"><Image className="w-4 h-4" /> الصور</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2"><BookOpen className="w-4 h-4" /> الحجوزات</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
};

// Room Categories sub-component
const RoomCategories = ({ hotelId }: { hotelId: string }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"room_categories"> | null>(null);
  const [form, setForm] = useState({ name_ar: "", name_en: "", price_per_night: 0, max_guests: 2, total_rooms: 1 });

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
      toast.success(editing ? "تم التحديث" : "تمت الإضافة");
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
      toast.success("تم الحذف");
    },
  });

  const resetForm = () => {
    setForm({ name_ar: "", name_en: "", price_per_night: 0, max_guests: 2, total_rooms: 1 });
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">فئات الغرف والأسعار</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-cta gap-2"><Plus className="w-4 h-4" /> إضافة فئة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>الاسم (عربي)</Label><Input value={form.name_ar} onChange={(e) => setForm(f => ({ ...f, name_ar: e.target.value }))} required /></div>
                <div><Label>Name (EN)</Label><Input value={form.name_en} onChange={(e) => setForm(f => ({ ...f, name_en: e.target.value }))} required /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>السعر/ليلة ($)</Label><Input type="number" min={0} value={form.price_per_night} onChange={(e) => setForm(f => ({ ...f, price_per_night: +e.target.value }))} required /></div>
                <div><Label>الحد الأقصى للضيوف</Label><Input type="number" min={1} value={form.max_guests} onChange={(e) => setForm(f => ({ ...f, max_guests: +e.target.value }))} /></div>
                <div><Label>عدد الغرف</Label><Input type="number" min={1} value={form.total_rooms} onChange={(e) => setForm(f => ({ ...f, total_rooms: +e.target.value }))} /></div>
              </div>
              <Button type="submit" className="w-full gradient-cta" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "جاري الحفظ..." : editing ? "تحديث" : "إضافة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {categories?.map((cat) => (
          <div key={cat.id} className="bg-card rounded-xl p-4 border border-border/50 shadow-card flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{cat.name_ar}</h3>
              <p className="text-sm text-muted-foreground">{cat.name_en} • {cat.max_guests} ضيوف • {cat.total_rooms} غرفة</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-primary">${cat.price_per_night}/ليلة</span>
              <Button variant="outline" size="sm" onClick={() => {
                setEditing(cat);
                setForm({ name_ar: cat.name_ar, name_en: cat.name_en, price_per_night: cat.price_per_night, max_guests: cat.max_guests, total_rooms: cat.total_rooms });
                setOpen(true);
              }}><Pencil className="w-4 h-4" /></Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(cat.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {categories?.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد فئات غرف. أضف فئة جديدة!</p>}
      </div>
    </div>
  );
};

// Hotel Photos sub-component
const HotelPhotos = ({ hotelId }: { hotelId: string }) => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: photos } = useQuery({
    queryKey: ["hotel-photos", hotelId],
    queryFn: async () => {
      const { data } = await supabase.from("hotel_photos").select("*").eq("hotel_id", hotelId).order("sort_order");
      return data ?? [];
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${hotelId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("hotel-photos").upload(path, file);
      if (uploadError) { toast.error(uploadError.message); continue; }

      const { data: { publicUrl } } = supabase.storage.from("hotel-photos").getPublicUrl(path);
      await supabase.from("hotel_photos").insert({ hotel_id: hotelId, url: publicUrl, sort_order: (photos?.length ?? 0) });
    }

    queryClient.invalidateQueries({ queryKey: ["hotel-photos"] });
    setUploading(false);
    toast.success("تم رفع الصور بنجاح");
  };

  const deletePhoto = async (photo: Tables<"hotel_photos">) => {
    // Extract path from URL
    const urlParts = photo.url.split("/hotel-photos/");
    if (urlParts[1]) {
      await supabase.storage.from("hotel-photos").remove([urlParts[1]]);
    }
    await supabase.from("hotel_photos").delete().eq("id", photo.id);
    queryClient.invalidateQueries({ queryKey: ["hotel-photos"] });
    toast.success("تم حذف الصورة");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">صور الفندق</h2>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          <Button asChild className="gradient-cta gap-2" disabled={uploading}>
            <span><Upload className="w-4 h-4" /> {uploading ? "جاري الرفع..." : "رفع صور"}</span>
          </Button>
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos?.map((photo) => (
          <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-border/50">
            <img src={photo.url} alt="" className="w-full h-40 object-cover" />
            <button
              onClick={() => deletePhoto(photo)}
              className="absolute top-2 left-2 bg-destructive text-destructive-foreground p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {photos?.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">
            <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد صور. ارفع صور فندقك!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Hotel Bookings sub-component
const HotelBookings = ({ hotelId }: { hotelId: string }) => {
  const { data: bookings } = useQuery({
    queryKey: ["hotel-bookings", hotelId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*, room_categories(name_ar)")
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">حجوزات فندقك</h2>
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-right p-3 font-medium text-muted-foreground">الضيف</th>
                <th className="text-right p-3 font-medium text-muted-foreground">الغرفة</th>
                <th className="text-right p-3 font-medium text-muted-foreground">الوصول</th>
                <th className="text-right p-3 font-medium text-muted-foreground">المغادرة</th>
                <th className="text-right p-3 font-medium text-muted-foreground">المبلغ</th>
                <th className="text-right p-3 font-medium text-muted-foreground">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings?.map((b) => (
                <tr key={b.id}>
                  <td className="p-3 text-foreground">{b.guest_first_name} {b.guest_last_name}</td>
                  <td className="p-3 text-foreground">{(b.room_categories as any)?.name_ar}</td>
                  <td className="p-3 text-foreground">{b.check_in}</td>
                  <td className="p-3 text-foreground">{b.check_out}</td>
                  <td className="p-3 font-medium text-foreground">${b.total_price}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      b.status === "confirmed" ? "bg-green-100 text-green-800" :
                      b.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                    }`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bookings?.length === 0 && <p className="text-center text-muted-foreground py-12">لا توجد حجوزات حتى الآن</p>}
      </div>
    </div>
  );
};

export default HotelPanel;
