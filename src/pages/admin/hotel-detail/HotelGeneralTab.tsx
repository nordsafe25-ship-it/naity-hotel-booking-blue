import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Save, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";
import { SYRIAN_MAIN_CITIES } from "@/lib/cities";

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

  const { data: techPartners = [] } = useQuery({
    queryKey: ["tech-partners-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tech_partners")
        .select("id, name, name_ar")
        .eq("is_active", true)
        .order("name");
      return data ?? [];
    },
  });

  const { data: apiCompanies = [] } = useQuery({
    queryKey: ["api-companies-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("api_companies")
        .select("id, name, name_ar")
        .eq("status", "active")
        .order("name");
      return data ?? [];
    },
  });

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
    floor: (hotel as any).floor ?? null,
    neighborhood: (hotel as any).neighborhood ?? "",
    check_in_time: (hotel as any).check_in_time ?? "14:00",
    check_out_time: (hotel as any).check_out_time ?? "12:00",
    house_rules_ar: (hotel as any).house_rules_ar ?? "",
    house_rules_en: (hotel as any).house_rules_en ?? "",
    bedrooms: (hotel as any).bedrooms ?? 1,
    bathrooms: (hotel as any).bathrooms ?? 1,
    area_sqm: (hotel as any).area_sqm ?? null,
    tech_partner_id: (hotel as any).tech_partner_id ?? null,
    company_id: (hotel as any).company_id ?? null,
    external_hotel_id: (hotel as any).external_hotel_id ?? "",
    breakfast_available: (hotel as any).breakfast_available ?? false,
    breakfast_type: (hotel as any).breakfast_type ?? "none",
    breakfast_season_start: (hotel as any).breakfast_season_start ?? "",
    breakfast_season_end: (hotel as any).breakfast_season_end ?? "",
    breakfast_price: (hotel as any).breakfast_price ?? 0,
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
      const payload = {
        ...form,
        tech_partner_id: form.tech_partner_id || null,
        floor: form.floor !== "" && form.floor != null ? Number(form.floor) : null,
        area_sqm: form.area_sqm !== "" && form.area_sqm != null ? Number(form.area_sqm) : null,
        bedrooms: form.bedrooms !== "" && form.bedrooms != null ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms !== "" && form.bathrooms != null ? Number(form.bathrooms) : null,
        stars: form.stars != null ? Number(form.stars) : null,
      };
      const { error } = await supabase.from("hotels").update(payload as any).eq("id", hotel.id);
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

        {form.property_type === "apartment" && (
          <div className="space-y-4 border border-blue-200 bg-blue-50/30 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-700">
              {lang === "ar" ? "🏠 تفاصيل الشقة" : "🏠 Apartment Details"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label>{lang === "ar" ? "غرف النوم" : "Bedrooms"}</Label>
                <Input type="number" min={1} value={form.bedrooms}
                  onChange={e => setForm(f => ({ ...f, bedrooms: +e.target.value }))} />
              </div>
              <div>
                <Label>{lang === "ar" ? "الحمامات" : "Bathrooms"}</Label>
                <Input type="number" min={1} value={form.bathrooms}
                  onChange={e => setForm(f => ({ ...f, bathrooms: +e.target.value }))} />
              </div>
              <div>
                <Label>{lang === "ar" ? "الطابق" : "Floor"}</Label>
                <Input type="number" min={0} value={form.floor}
                  onChange={e => setForm(f => ({ ...f, floor: +e.target.value }))} />
              </div>
              <div>
                <Label>{lang === "ar" ? "المساحة م²" : "Area m²"}</Label>
                <Input type="number" min={0} value={form.area_sqm}
                  onChange={e => setForm(f => ({ ...f, area_sqm: +e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>{lang === "ar" ? "الحي / المنطقة" : "Neighborhood"}</Label>
              <Input value={form.neighborhood}
                onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}
                placeholder={lang === "ar" ? "مثال: المزة، باب توما..." : "e.g. Mezzeh, Bab Touma..."} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{lang === "ar" ? "وقت تسجيل الوصول" : "Check-in Time"}</Label>
                <Input type="time" value={form.check_in_time}
                  onChange={e => setForm(f => ({ ...f, check_in_time: e.target.value }))} />
              </div>
              <div>
                <Label>{lang === "ar" ? "وقت تسجيل المغادرة" : "Check-out Time"}</Label>
                <Input type="time" value={form.check_out_time}
                  onChange={e => setForm(f => ({ ...f, check_out_time: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>{lang === "ar" ? "قواعد الإقامة (عربي)" : "House Rules (Arabic)"}</Label>
              <Textarea rows={3} value={form.house_rules_ar}
                onChange={e => setForm(f => ({ ...f, house_rules_ar: e.target.value }))}
                placeholder="مثال: لا تدخين، لا حيوانات، الهدوء بعد 11 مساءً" />
            </div>
            <div>
              <Label>House Rules (English)</Label>
              <Textarea rows={3} value={form.house_rules_en}
                onChange={e => setForm(f => ({ ...f, house_rules_en: e.target.value }))}
                placeholder="e.g. No smoking, no pets, quiet after 11 PM" />
            </div>
          </div>
        )}

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
            <select value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">{tx("اختر المدينة", "Select City")}</option>
              {SYRIAN_MAIN_CITIES.map(c => (
                <option key={c.en} value={c.en}>{lang === "ar" ? c.ar : c.en}</option>
              ))}
            </select>
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

        {/* Tech Partner */}
        <div>
          <Label>
            {lang === "ar" ? "نظام إدارة الفندق / الشقة" : "Property Management System"}
          </Label>
          <select
            value={form.tech_partner_id ?? ""}
            onChange={e => setForm(f => ({ ...f, tech_partner_id: e.target.value || null }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">
              {lang === "ar" ? "— بدون نظام / مستقل —" : "— None / Independent —"}
            </option>
            {techPartners.map((p: any) => (
              <option key={p.id} value={p.id}>
                {lang === "ar" ? (p.name_ar || p.name) : p.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === "ar"
              ? "اختر الشركة التي تدير سيستم هذا العقار — يُستخدم لاحتساب العمولات"
              : "Select the tech company managing this property — used for commission tracking"}
          </p>
        </div>

        {/* API Company */}
        <div>
          <Label>
            {lang === "ar" ? "شركة إدارة الفندق (API)" : "Hotel API Company"}
          </Label>
          <select
            value={form.company_id ?? ""}
            onChange={e => setForm(f => ({ ...f, company_id: e.target.value || null }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">
              {lang === "ar" ? "— بدون API —" : "— No API —"}
            </option>
            {apiCompanies.map((c: any) => (
              <option key={c.id} value={c.id}>
                {lang === "ar" ? (c.name_ar || c.name) : c.name}
              </option>
            ))}
          </select>
        </div>

        {form.company_id && (
          <div>
            <Label>
              {lang === "ar" ? "رقم الفندق في نظام الشركة" : "Hotel ID in Company System"}
            </Label>
            <Input
              type="number"
              value={form.external_hotel_id}
              onChange={e => setForm(f => ({ ...f, external_hotel_id: e.target.value ? +e.target.value : null }))}
              placeholder={lang === "ar" ? "مثال: 42" : "e.g. 42"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {lang === "ar" ? "الرقم المستخدم في API الشركة لتعريف هذا الفندق" : "The hotel ID used in the company's API"}
            </p>
          </div>
        )}
      </div>

      {/* Breakfast Section */}
      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
        <h2 className="font-semibold text-foreground text-lg">
          {tx("🍳 خدمة الفطور", "🍳 Breakfast Service")}
        </h2>

        <div className="space-y-2">
          <Label>{tx("هل يقدم الفندق فطور؟", "Does the hotel offer breakfast?")}</Label>
          <div className="flex flex-col gap-2">
            {[
              { val: "none", ar: "لا يوجد فطور", en: "No breakfast" },
              { val: "all_year", ar: "فطور طوال السنة", en: "All year round" },
              { val: "seasonal", ar: "فطور موسمي (حدد الفترة)", en: "Seasonal (specify period)" },
            ].map(opt => (
              <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="breakfast_type"
                  value={opt.val}
                  checked={form.breakfast_type === opt.val}
                  onChange={() => setForm(f => ({
                    ...f,
                    breakfast_type: opt.val,
                    breakfast_available: opt.val !== "none",
                  }))}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-foreground">{lang === "ar" ? opt.ar : opt.en}</span>
              </label>
            ))}
          </div>
        </div>

        {form.breakfast_type === "seasonal" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{tx("من تاريخ", "From date")}</Label>
              <Input type="date" value={form.breakfast_season_start}
                onChange={e => setForm(f => ({ ...f, breakfast_season_start: e.target.value }))} />
            </div>
            <div>
              <Label>{tx("إلى تاريخ", "To date")}</Label>
              <Input type="date" value={form.breakfast_season_end}
                onChange={e => setForm(f => ({ ...f, breakfast_season_end: e.target.value }))} />
            </div>
          </div>
        )}

        {form.breakfast_type !== "none" && (
          <div>
            <Label>{tx("سعر الفطور / شخص / ليلة ($)", "Breakfast price / person / night ($)")}</Label>
            <Input type="number" min={0} value={form.breakfast_price}
              onChange={e => setForm(f => ({ ...f, breakfast_price: +e.target.value }))} />
          </div>
        )}
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
