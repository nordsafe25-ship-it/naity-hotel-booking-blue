import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail, Phone, MapPin, Building2, Send,
  Globe, User, MessageSquare, Tag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

const COUNTRIES = [
  { value: "Syria", ar: "سوريا", flag: "🇸🇾" },
  { value: "Turkey", ar: "تركيا", flag: "🇹🇷" },
  { value: "Germany", ar: "ألمانيا", flag: "🇩🇪" },
  { value: "Sweden", ar: "السويد", flag: "🇸🇪" },
  { value: "Norway", ar: "النرويج", flag: "🇳🇴" },
  { value: "UAE", ar: "الإمارات", flag: "🇦🇪" },
  { value: "Saudi Arabia", ar: "السعودية", flag: "🇸🇦" },
  { value: "Jordan", ar: "الأردن", flag: "🇯🇴" },
  { value: "Lebanon", ar: "لبنان", flag: "🇱🇧" },
  { value: "Iraq", ar: "العراق", flag: "🇮🇶" },
  { value: "Egypt", ar: "مصر", flag: "🇪🇬" },
  { value: "France", ar: "فرنسا", flag: "🇫🇷" },
  { value: "UK", ar: "المملكة المتحدة", flag: "🇬🇧" },
  { value: "USA", ar: "أمريكا", flag: "🇺🇸" },
  { value: "Netherlands", ar: "هولندا", flag: "🇳🇱" },
  { value: "Other", ar: "أخرى", flag: "🌍" },
];

const SUBJECTS = [
  { value: "booking_issue", ar: "مشكلة في حجز", en: "Booking Issue" },
  { value: "hotel_inquiry", ar: "استفسار عن فندق", en: "Hotel Inquiry" },
  { value: "payment", ar: "استفسار عن الدفع", en: "Payment Question" },
  { value: "cancellation", ar: "طلب إلغاء", en: "Cancellation Request" },
  { value: "partnership", ar: "شراكة / إضافة فندق", en: "Partnership / Add Hotel" },
  { value: "complaint", ar: "شكوى", en: "Complaint" },
  { value: "suggestion", ar: "اقتراح", en: "Suggestion" },
  { value: "other", ar: "أخرى", en: "Other" },
];

const Contact = () => {
  const { t, lang } = useI18n();
  const tx = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast.error(tx("الرجاء إدخال الاسم الكامل", "Please enter your full name"));
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error(tx("الرجاء إدخال بريد إلكتروني صحيح", "Please enter a valid email"));
      return;
    }
    if (!phone.trim() || phone.length < 7) {
      toast.error(tx("الرجاء إدخال رقم هاتف صحيح", "Please enter a valid phone number"));
      return;
    }
    if (!country) {
      toast.error(tx("الرجاء اختيار الدولة", "Please select your country"));
      return;
    }
    if (!subject) {
      toast.error(tx("الرجاء اختيار موضوع الرسالة", "Please select a subject"));
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      toast.error(tx("الرجاء كتابة رسالة لا تقل عن 10 أحرف", "Message must be at least 10 characters"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        country,
        subject,
        message: message.trim(),
      });
      if (error) throw error;

      setSent(true);
      toast.success(tx(
        "تم إرسال رسالتك بنجاح! سنرد عليك خلال 24 ساعة.",
        "Message sent! We'll get back to you within 24 hours."
      ));
    } catch (err: any) {
      toast.error(err.message || tx("حدث خطأ، حاول مرة أخرى", "An error occurred, please try again"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto mb-12 space-y-4"
          >
            <h1 className="text-4xl font-extrabold text-accent">{t("contact.title")}</h1>
            <p className="text-muted-foreground text-lg">{t("contact.subtitle")}</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3 bg-card rounded-2xl p-6 shadow-card border border-border/50"
            >
              {sent ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Send className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {tx("تم الإرسال بنجاح!", "Message Sent!")}
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {tx(
                      "شكراً لتواصلك معنا. سيرد فريقنا على بريدك الإلكتروني خلال 24 ساعة.",
                      "Thank you for reaching out. Our team will reply to your email within 24 hours."
                    )}
                  </p>
                  <button
                    onClick={() => {
                      setSent(false);
                      setFullName(""); setEmail(""); setPhone("");
                      setCountry(""); setSubject(""); setMessage("");
                    }}
                    className="text-sm text-primary underline underline-offset-2 hover:opacity-70 transition"
                  >
                    {tx("إرسال رسالة أخرى", "Send another message")}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    {tx("أرسل لنا رسالة", "Send Us a Message")}
                  </h3>

                  {/* Row 1: Name + Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        {tx("الاسم الكامل", "Full Name")} *
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={tx("اسمك الكامل", "Your full name")}
                        className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        {tx("البريد الإلكتروني", "Email")} *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        dir="ltr"
                        className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition"
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone + Country */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        {tx("رقم الهاتف", "Phone Number")} *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+963 912 345 678"
                        dir="ltr"
                        className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        {tx("الدولة", "Country")} *
                      </label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition cursor-pointer"
                      >
                        <option value="">{tx("اختر دولتك", "Select your country")}</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.flag} {lang === "ar" ? c.ar : c.value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                      {tx("موضوع الرسالة", "Subject")} *
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition cursor-pointer"
                    >
                      <option value="">{tx("اختر الموضوع", "Select subject")}</option>
                      {SUBJECTS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {lang === "ar" ? s.ar : s.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                      {tx("الرسالة", "Message")} *
                    </label>
                    <textarea
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={tx("اكتب رسالتك هنا بالتفصيل...", "Write your message in detail...")}
                      className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground resize-none focus:ring-2 focus:ring-primary/30 transition"
                    />
                    <p className="text-xs text-muted-foreground text-end">
                      {message.length} {tx("حرف", "chars")}
                      {message.length < 10 && message.length > 0 && (
                        <span className="text-red-400 ms-1">
                          ({tx("10 على الأقل", "min 10")})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full gradient-cta text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {tx("جاري الإرسال...", "Sending...")}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {tx("إرسال الرسالة", "Send Message")}
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-5">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4"
              >
                <h3 className="font-bold text-foreground">
                  {tx("معلومات التواصل", "Contact Information")}
                </h3>
                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{tx("البريد", "Email")}</p>
                    <p className="text-sm font-medium text-foreground">support@naity.net</p>
                  </div>
                </div>

                {/* WhatsApp */}
                <a href="https://wa.me/963988495629" target="_blank" rel="noopener noreferrer"
                   className="flex items-start gap-3 hover:opacity-80 transition group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: "#25D366" }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.01c-1.784 0-3.535-.48-5.065-1.388l-.36-.214-3.742.982.999-3.648-.235-.374A9.86 9.86 0 012 12.05C2 6.477 6.477 2 12.05 2s10.05 4.477 10.05 10.05-4.477 10.05-10.05 10.05z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{tx("واتساب", "WhatsApp")}</p>
                    <p className="text-sm font-medium text-foreground group-hover:text-green-500 transition">+963 988 495 629</p>
                  </div>
                </a>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{tx("الموقع", "Location")}</p>
                    <p className="text-sm font-medium text-foreground">{tx("سوريا — دمشق", "Syria — Damascus")}</p>
                  </div>
                </div>
              </motion.div>

              {/* Social Media */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4"
              >
                <h3 className="font-bold text-foreground">
                  {tx("تابعنا على", "Follow Us On")}
                </h3>
                <div className="space-y-3">
                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/share/18NsXS2Eh2/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">Facebook</div>
                      <div className="text-xs text-muted-foreground">Naity</div>
                    </div>
                    <span className="text-muted-foreground group-hover:text-foreground transition">↗</span>
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://instagram.com/naity_booking"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">Instagram</div>
                      <div className="text-xs text-muted-foreground">@naity_booking</div>
                    </div>
                    <span className="text-muted-foreground group-hover:text-foreground transition">↗</span>
                  </a>
                </div>
              </motion.div>

              {/* Join Us CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-accent rounded-2xl p-6 text-accent-foreground space-y-3"
              >
                <Building2 className="w-8 h-8" />
                <h3 className="font-bold text-lg">{t("contact.hotelCta")}</h3>
                <p className="text-sm text-accent-foreground/80">{t("contact.hotelCtaDesc")}</p>
                <a
                  href="https://wa.me/963988495629?text=مرحباً،%20أريد%20إضافة%20فندقي%20إلى%20Naity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ background: "#25D366" }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.01c-1.784 0-3.535-.48-5.065-1.388l-.36-.214-3.742.982.999-3.648-.235-.374A9.86 9.86 0 012 12.05C2 6.477 6.477 2 12.05 2s10.05 4.477 10.05 10.05-4.477 10.05-10.05 10.05z"/>
                  </svg>
                  {tx("انضم إلينا عبر واتساب", "Join Us on WhatsApp")}
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
