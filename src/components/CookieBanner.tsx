import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

export default function CookieBanner() {
  const { lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("naity-cookies-accepted");
    if (!accepted) setTimeout(() => setVisible(true), 1200);
  }, []);

  const accept = () => {
    localStorage.setItem("naity-cookies-accepted", "true");
    setVisible(false);
  };

  return (
    <AnimatePresence>
    {visible && (
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 inset-x-0 z-50 p-4">
        <div className="max-w-xl mx-auto bg-card border border-border/50 rounded-2xl shadow-elevated p-5 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tx("نستخدم ملفات تعريف الارتباط لتحسين تجربتك. باستمرارك في استخدام Naity، فإنك توافق على ",
                "We use cookies to enhance your experience. By continuing to use Naity, you agree to our ")}
            <Link to="/privacy" className="text-primary underline underline-offset-2">
              {tx("سياسة الخصوصية", "Privacy Policy")}
            </Link>
            {tx(" و", " and ")}
            <Link to="/terms" className="text-primary underline underline-offset-2">
              {tx("الشروط والأحكام", "Terms & Conditions")}
            </Link>
          </p>
          <div className="flex items-center gap-3 justify-end">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition">
              {tx("اعرف أكثر", "Learn More")}
            </Link>
            <button onClick={accept}
              className="gradient-cta text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              {tx("أوافق وأكمل", "Accept & Continue")}
            </button>
          </div>
        </div>
      </motion.div>
    )}
    </AnimatePresence>
  );
}
