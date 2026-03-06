import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Star } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const HotelGeneralTab = ({ hotel }: { hotel: Tables<"hotels"> }) => {
  const { lang } = useI18n();
  const queryClient = useQueryClient();
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
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("hotels").update(form).eq("id", hotel.id);
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
          {lang === "ar" ? "المعلومات الأساسية" : "Basic Information"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
            <Input value={form.name_ar} onChange={(e) => setForm(f => ({ ...f, name_ar: e.target.value }))} required />
          </div>
          <div>
            <Label>Name (English)</Label>
            <Input value={form.name_en} onChange={(e) => setForm(f => ({ ...f, name_en: e.target.value }))} required />
          </div>
        </div>

        <div>
          <Label>{lang === "ar" ? "التصنيف بالنجوم" : "Star Rating"}</Label>
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
            <Label>{lang === "ar" ? "المدينة" : "City"}</Label>
            <Input value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} required />
          </div>
          <div>
            <Label>{lang === "ar" ? "العنوان" : "Address"}</Label>
            <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{lang === "ar" ? "هاتف التواصل" : "Contact Phone"}</Label>
            <Input value={form.contact_phone} onChange={(e) => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
          </div>
          <div>
            <Label>{lang === "ar" ? "بريد التواصل" : "Contact Email"}</Label>
            <Input type="email" value={form.contact_email} onChange={(e) => setForm(f => ({ ...f, contact_email: e.target.value }))} />
          </div>
        </div>

        <div>
          <Label>{lang === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
          <Textarea rows={4} value={form.description_ar} onChange={(e) => setForm(f => ({ ...f, description_ar: e.target.value }))} />
        </div>
        <div>
          <Label>Description (English)</Label>
          <Textarea rows={4} value={form.description_en} onChange={(e) => setForm(f => ({ ...f, description_en: e.target.value }))} />
        </div>

        <Button type="submit" className="gradient-cta gap-2" disabled={updateMutation.isPending}>
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? "..." : (lang === "ar" ? "حفظ التغييرات" : "Save Changes")}
        </Button>
      </div>
    </form>
  );
};

export default HotelGeneralTab;
