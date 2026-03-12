import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Building2, MapPin, Phone, Mail, User, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const SYRIAN_CITIES = [
  { en: "Damascus", ar: "دمشق" },
  { en: "Aleppo", ar: "حلب" },
  { en: "Homs", ar: "حمص" },
  { en: "Hama", ar: "حماة" },
  { en: "Lattakia", ar: "اللاذقية" },
  { en: "Tartus", ar: "طرطوس" },
];

const Join = () => {
  const { lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    property_type: "hotel",
    city: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.email || !form.city) {
      toast.error(tx("يرجى ملء جميع الحقول المطلوبة", "Please fill all required fields"));
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        country: form.city,
        subject: `Join Request — ${form.property_type === "apartment" ? "Apartment" : "Hotel"}`,
        message: `Property Type: ${form.property_type}\nCity: ${form.city}\n\n${form.message}`,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success(tx("تم إرسال طلبك بنجاح!", "Your request has been submitted!"));
    } catch (err: any) {
      toast.error(err.message || tx("حدث خطأ", "An error occurred"));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
            <span className="text-6xl">🎉</span>
          </motion.div>
          <h1 className="text-3xl font-extrabold text-foreground">
            {tx("شكراً لاهتمامك!", "Thank you for your interest!")}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {tx(
              "سيتواصل فريقنا معك قريباً لمساعدتك في إدراج عقارك على منصة Naity.",
              "Our team will contact you soon to help list your property on Naity."
            )}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
              {tx("انضم إلى Naity", "Join Naity")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              {tx(
                "إذا كنت تملك فندقاً أو شقة سياحية، تواصل معنا لإدراج عقارك على المنصة.",
                "If you own a hotel or an apartment, contact us to list your property."
              )}
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="bg-card rounded-xl p-6 md:p-8 shadow-card border border-border/50 space-y-5"
          >
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                {tx("الاسم الكامل", "Full Name")} *
              </label>
              <input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition"
                required
              />
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  {tx("رقم الهاتف", "Phone Number")} *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition"
                  dir="ltr"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  {tx("البريد الإلكتروني", "Email")} *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {/* Property Type + City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  {tx("نوع العقار", "Property Type")} *
                </label>
                <select
                  value={form.property_type}
                  onChange={e => setForm(f => ({ ...f, property_type: e.target.value }))}
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground cursor-pointer"
                >
                  <option value="hotel">{tx("🏨 فندق", "🏨 Hotel")}</option>
                  <option value="apartment">{tx("🏠 شقة سياحية", "🏠 Apartment")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {tx("المدينة", "City")} *
                </label>
                <select
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground cursor-pointer"
                  required
                >
                  <option value="">{tx("اختر المدينة", "Select City")}</option>
                  {SYRIAN_CITIES.map(c => (
                    <option key={c.en} value={c.en}>{lang === "ar" ? c.ar : c.en}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                {tx("رسالة إضافية", "Additional Message")}
              </label>
              <textarea
                rows={4}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground resize-none focus:ring-2 focus:ring-primary/30 transition"
                placeholder={tx("أخبرنا المزيد عن عقارك...", "Tell us more about your property...")}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full gradient-cta text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? tx("جاري الإرسال...", "Submitting...") : tx("أرسل طلبك", "Submit Request")}
            </button>
          </motion.form>
        </div>
      </div>
    </Layout>
  );
};

export default Join;
