import Layout from "@/components/Layout";
import { useI18n } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";

export default function Terms() {
  const { lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;

  const sections = [
    {
      title: tx("القبول بالشروط", "Acceptance of Terms"),
      body: tx("باستخدام منصة Naity، فإنك توافق على هذه الشروط والأحكام بالكامل وتلتزم بها.",
               "By using the Naity platform, you agree to and are bound by these Terms & Conditions in full."),
    },
    {
      title: tx("الخدمة", "The Service"),
      body: tx("Naity هي منصة وساطة لحجز الفنادق. نحن نربطك بالفنادق المسجلة على المنصة عبر اتصال API مباشر. Naity ليست مسؤولة عن جودة الخدمة المقدمة مباشرة من الفندق.",
               "Naity is a hotel booking intermediary platform. We connect you with registered hotels via direct API. Naity is not responsible for the quality of service provided directly by the hotel."),
    },
    {
      title: tx("الدفع", "Payment"),
      body: tx("يُطلب دفع عربون 10% عبر بطاقة الائتمان لتأكيد الحجز. المبلغ المتبقي (90%) يُدفع نقداً للفندق عند الوصول. تتم معالجة المدفوعات عبر Stripe وفق معايير الأمان الأوروبية.",
               "A 10% deposit by credit card is required to confirm your booking. The remaining 90% is paid in cash to the hotel on arrival. Payments are processed by Stripe under European security standards."),
    },
    {
      title: tx("المسؤولية", "Liability"),
      body: tx("Naity وسيط ولا تتحمل مسؤولية أي اختلاف بين المعلومات المعروضة والواقع الفعلي. ننصح بالتواصل مع الفندق مباشرة للمتطلبات الخاصة.",
               "Naity is an intermediary and bears no responsibility for discrepancies between displayed information and actual hotel conditions."),
    },
    {
      title: tx("التعديلات", "Amendments"),
      body: tx("تحتفظ Naity بحق تعديل هذه الشروط. التغييرات الجوهرية تُبلَّغ عبر البريد الإلكتروني.",
               "Naity reserves the right to amend these Terms. Material changes will be communicated by email."),
    },
    {
      title: tx("القانون المطبق", "Governing Law"),
      body: tx("تخضع هذه الشروط للقانون النرويجي. أي نزاع يُحل أمام المحاكم النرويجية.",
               "These Terms are governed by Norwegian law. Disputes shall be resolved before Norwegian courts."),
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground">{tx("الشروط والأحكام", "Terms & Conditions")}</h1>
          <p className="text-sm text-muted-foreground">{tx("آخر تحديث: مارس 2025", "Last updated: March 2025")}</p>
        </div>

        {sections.slice(0, 2).map((s, i) => (
          <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 shadow-card space-y-3">
            <h2 className="border-s-4 border-primary ps-3 font-bold text-lg text-foreground">{s.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}

        {/* Cancellation - special styling */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-6 space-y-3">
          <h2 className="border-s-4 border-amber-500 ps-3 font-bold text-lg text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {tx("سياسة الإلغاء والاسترداد", "Cancellation & Refund Policy")}
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {tx(
              `الحجوزات خارج مواسم الذروة:
• إلغاء قبل 48 ساعة أو أكثر: استرداد كامل للعربون (100%)
• إلغاء بين 24 و48 ساعة: استرداد 50% من العربون
• إلغاء في أقل من 24 ساعة: لا يوجد استرداد (0%)

⚠️ موسم الذروة — سياسة عدم الاسترداد المطلق:
العربون المدفوع (10%) غير قابل للاسترداد خلال:

🌞 موسم الصيف: من 15 يونيو إلى 15 سبتمبر من كل عام

تُطبق هذه السياسة بصرف النظر عن تاريخ الإلغاء أو سببه.
بإتمام الحجز خلال هذه الفترة، فإنك تقر بأن العربون غير قابل للاسترداد.`,
              `Outside Peak Season:
• Cancellation 48+ hours before check-in: Full refund (100%)
• Cancellation 24–48 hours before: 50% refund
• Cancellation less than 24 hours: No refund (0%)

⚠️ PEAK SEASON — ABSOLUTE NO-REFUND:
The 10% deposit is non-refundable during:

🌞 Summer Season: June 15 to September 15 each year

This applies regardless of cancellation date or reason.
By completing a booking in this period, you acknowledge the no-refund policy.`
            )}
          </div>
        </div>

        {sections.slice(2).map((s, i) => (
          <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 shadow-card space-y-3">
            <h2 className="border-s-4 border-primary ps-3 font-bold text-lg text-foreground">{s.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
