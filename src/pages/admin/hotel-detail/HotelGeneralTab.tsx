import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Save, Star } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const HOTEL_AMENITY_OPTIONS = [
  { key: "wifi", label_en: "High-speed Wi-Fi", label_ar: "واي فاي عالي السرعة" },
  { key: "electricity", label_en: "24/7 Electricity", label_ar: "كهرباء 24/7" },
  { key: "shuttle", label_en: "Airport Shuttle", label_ar: "نقل من المطار" },
  { key: "breakfast", label_en: "Breakfast Included", label_ar: "إفطار مشمول" },
  { key: "gym", label_en: "Gym/Spa", label_ar: "صالة رياضية/سبا" },
];

const HotelGeneralTab = ({ hotel }: { hotel: Tables<"hotels"> }) => {
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;

  const [form, setForm] = useState({
    name_en: hotel.name_en,
    name_ar: hotel.name_ar,
    description_en: hotel.description_en ?? "",
    description_ar: hotel.description_ar ?? "",
    stars: hotel.stars,
    city: hotel.city,
    address: hotel.address ?? "",
    contact_phone: hotel.contact_phone ?? "",
    contact_email: hotel.contact_email ?? "",
    property_type: (hotel as any).property_type ?? "hotel",
    amenities: (hotel.amenities as string[]) ?? [],
  });

  const toggleAmenity = (key: string) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter(a => a !== key)
        : [...f.amenities, key],
    }));
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("hotels").update(form as any).eq("id", hotel.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hotel-detail", hotel.id] });
      toast.success(lang === "ar" ? "تم تحديث بيانات الفندق" : "Hotel updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-6 max-w-2xl">
      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-5">
        <h2 className="font-semibold text-foreground text-lg">
          {tx("المعلومات الأساسية", "Basic Information")}
        </h2>

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
                  name="property_type"
                  checked={form.property_type === opt.val}
                  onChange={() => setForm(f => ({ ...f, property_type: opt.val }))}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-foreground">{lang === "ar" ? opt.ar : opt.en}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{tx("الاسم (عربي)", "Name (Arabic)")}</Label>
            <Input value={form.name_ar} onChange={(e) => setForm(f => ({ ...f, name_ar: e.target.value }))} required />
          </div>
          <div>
            <Label>Name (English)</Label>
            <Input value={form.name_en} onChange={(e) => setForm(f => ({ ...f, name_en: e.target.value }))} required />
          </div>
        </div>

        <div>
          <Label>{tx("التصنيف بالنجوم", "Star Rating")}</Label>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm(f => ({ ...f, stars: s }))}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star className={`w-6 h-6 ${s <= form.stars ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{tx("المدينة", "City")}</Label>
            <Input value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} required />
          </div>
          <div>
            <Label>{tx("العنوان", "Address")}</Label>
            <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{tx("هاتف التواصل", "Contact Phone")}</Label>
            <Input value={form.contact_phone} onChange={(e) => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
          </div>
          <div>
            <Label>{tx("بريد التواصل", "Contact Email")}</Label>
            <Input type="email" value={form.contact_email} onChange={(e) => setForm(f => ({ ...f, contact_email: e.target.value }))} />
          </div>
        </div>

        <div>
          <Label>{tx("الوصف (عربي)", "Description (Arabic)")}</Label>
          <Textarea rows={4} value={form.description_ar} onChange={(e) => setForm(f => ({ ...f, description_ar: e.target.value }))} />
        </div>
        <div>
          <Label>Description (English)</Label>
          <Textarea rows={4} value={form.description_en} onChange={(e) => setForm(f => ({ ...f, description_en: e.target.value }))} />
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
        <h2 className="font-semibold text-foreground text-lg">
          {tx("مرافق الفندق", "Hotel Amenities")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {HOTEL_AMENITY_OPTIONS.map(a => (
            <label key={a.key} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted transition">
              <Checkbox
                checked={form.amenities.includes(a.key)}
                onCheckedChange={() => toggleAmenity(a.key)}
              />
              <span className="text-sm text-foreground">{lang === "ar" ? a.label_ar : a.label_en}</span>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" className="gradient-cta gap-2" disabled={updateMutation.isPending}>
        <Save className="w-4 h-4" />
        {updateMutation.isPending ? "..." : tx("حفظ التغييرات", "Save Changes")}
      </Button>
    </form>
  );
};

export default HotelGeneralTab;
