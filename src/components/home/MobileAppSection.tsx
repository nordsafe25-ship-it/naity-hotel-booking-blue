import { motion } from "framer-motion";
import { Zap, Gift, Settings, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const MobileAppSection = () => {
  const { lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;

  const benefits = [
    { icon: Zap, text: tx("حجوزات أسرع", "Faster Bookings") },
    { icon: Gift, text: tx("عروض حصرية", "Exclusive Deals") },
    { icon: Settings, text: tx("إدارة حجوزاتك بسهولة", "Manage Bookings Easily") },
  ];

  return (
    <section className="py-12 md:py-16 bg-accent overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 mb-2">
            <Download className="w-7 h-7 text-accent-foreground" />
          </div>

          <h2 className="text-xl md:text-3xl font-bold text-accent-foreground">
            {tx("حمّل تطبيق Naity", "Download the Naity App")}
          </h2>

          <p className="text-accent-foreground/70 text-sm max-w-md mx-auto">
            {tx(
              "احجز فنادقك المفضلة من هاتفك بسهولة تامة واستمتع بعروض حصرية متاحة فقط عبر التطبيق",
              "Book your favorite hotels from your phone with ease and enjoy exclusive deals available only via the app"
            )}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <b.icon className="w-3.5 h-3.5 text-accent-foreground" />
                </div>
                <span className="text-accent-foreground text-xs font-medium">{b.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 bg-accent-foreground text-accent px-5 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              App Store
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 bg-accent-foreground text-accent px-5 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
                <path d="M3.18 23.71c.46.27 1.03.3 1.52.1l12.13-6.97-3.04-3.04-10.61 9.91zM.53 1.33C.2 1.7 0 2.24 0 2.91v18.18c0 .67.2 1.21.53 1.58l.08.08 10.17-10.17v-.24L.61 1.25l-.08.08zM17.87 14.77l-3.4-3.4v-.24l3.4-3.4.08.04 4.02 2.28c1.15.65 1.15 1.72 0 2.37l-4.02 2.28-.08.07zM14.4 11.13L4.78.56c-.5-.27-1.12-.3-1.6-.1L14.4 11.13z" />
              </svg>
              Google Play
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MobileAppSection;
