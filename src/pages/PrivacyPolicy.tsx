import Layout from "@/components/Layout";
import { useI18n } from "@/lib/i18n";

export default function PrivacyPolicy() {
  const { lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;

  const sections = [
    {
      title: tx("ما نجمعه", "What We Collect"),
      body: tx("نجمع الاسم، البريد الإلكتروني، رقم الهاتف، بيانات الدفع (عبر Stripe — لا نخزنها)، وصورة جواز السفر (لمتطلبات الفنادق القانونية).",
               "We collect name, email, phone, payment data (via Stripe — NOT stored by us), and passport image (for hotel legal requirements)."),
    },
    {
      title: tx("كيف نستخدم بياناتك", "How We Use Your Data"),
      body: tx("لإتمام الحجوزات، إرسال التأكيدات، الامتثال للمتطلبات القانونية المحلية، وتحسين المنصة.",
               "To complete bookings, send confirmations, comply with local legal requirements, and improve the platform."),
    },
    {
      title: tx("مشاركة البيانات", "Data Sharing"),
      body: tx("نشارك فقط بيانات الحجز الضرورية مع الفندق المعني. لا تُباع بياناتك لأطراف ثالثة أبداً.",
               "We share only necessary booking data with the relevant hotel. Data is never sold to third parties."),
    },
    {
      title: tx("الاحتفاظ بالبيانات", "Data Retention"),
      body: tx("يتم الاحتفاظ ببيانات الحجز لمدة 3 سنوات وفقاً لقانون المحاسبة النرويجي.",
               "Booking data is retained for 3 years per Norwegian accounting law."),
    },
    {
      title: tx("حقوقك", "Your Rights"),
      body: tx("يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها عبر البريد: privacy@naity.com",
               "You can request access, correction, or deletion of your data via email: privacy@naity.com"),
    },
    {
      title: tx("الأمان", "Security"),
      body: tx("تشفير SSL. بيانات الدفع تُعالج حصرياً عبر Stripe ولا نخزنها.",
               "SSL encryption. Payment data is handled exclusively by Stripe, not stored by us."),
    },
    {
      title: tx("ملفات تعريف الارتباط", "Cookies"),
      body: tx("نستخدم ملفات تعريف ارتباط وظيفية فقط: تفضيل اللغة والجلسة.",
               "We use only functional cookies: language preference and session."),
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground">{tx("سياسة الخصوصية", "Privacy Policy")}</h1>
          <p className="text-sm text-muted-foreground">{tx("آخر تحديث: مارس 2025", "Last updated: March 2025")}</p>
        </div>

        {sections.map((s, i) => (
          <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 shadow-card space-y-3">
            <h2 className="border-s-4 border-primary ps-3 font-bold text-lg text-foreground">{s.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
