import { motion } from "framer-motion";
import { Building2, Wifi, Globe, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { useI18n } from "@/lib/i18n";

const HowItWorks = () => {
  const { t, lang } = useI18n();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  const steps = [
    { icon: Building2, title: t("how.step1.title"), desc: t("how.step1.desc") },
    { icon: Wifi, title: t("how.step2.title"), desc: t("how.step2.desc") },
    { icon: Globe, title: t("how.step3.title"), desc: t("how.step3.desc") },
  ];

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto mb-16 space-y-4"
          >
            <h1 className="text-4xl font-extrabold text-accent">{t("how.title")}</h1>
            <p className="text-muted-foreground text-lg">{t("how.subtitle")}</p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex gap-6 items-start relative"
              >
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-card">
                    <step.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-0.5 h-16 bg-border my-2" />
                  )}
                </div>
                <div className="pb-12">
                  <div className="text-xs font-semibold text-primary mb-1">{t("how.step")} {i + 1}</div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-card rounded-2xl p-8 shadow-card border border-border/50 max-w-2xl mx-auto"
          >
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              {t("how.result")}
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              {[t("how.result1"), t("how.result2"), t("how.result3"), t("how.result4")].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Arrow className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
