import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Building2 } from "lucide-react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

const Contact = () => {
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t("contact.successToast"));
  };

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto mb-12 space-y-4"
          >
            <h1 className="text-4xl font-extrabold text-accent">{t("contact.title")}</h1>
            <p className="text-muted-foreground text-lg">{t("contact.subtitle")}</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-3 bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t("contact.name")}</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition"
                    placeholder={t("contact.namePlaceholder")}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t("contact.email")}</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t("contact.subject")}</label>
                <input
                  type="text"
                  required
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition"
                  placeholder={t("contact.subjectPlaceholder")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t("contact.message")}</label>
                <textarea
                  rows={5}
                  required
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground resize-none focus:ring-2 focus:ring-primary/30 transition"
                  placeholder={t("contact.messagePlaceholder")}
                />
              </div>
              <button
                type="submit"
                className="w-full gradient-cta text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                {t("contact.send")}
              </button>
            </form>

            <div className="lg:col-span-2 space-y-6">
              {[
                { icon: Mail, label: t("contact.emailLabel"), value: "help@naity.com" },
                { icon: Phone, label: t("contact.phoneLabel"), value: "+1 800 NAITY" },
                { icon: MapPin, label: t("contact.officeLabel"), value: t("contact.office") },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                    <div className="font-medium text-foreground">{item.value}</div>
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-accent rounded-2xl p-6 text-accent-foreground space-y-3 mt-4"
              >
                <Building2 className="w-8 h-8" />
                <h3 className="font-bold text-lg">{t("contact.hotelCta")}</h3>
                <p className="text-sm text-accent-foreground/80">{t("contact.hotelCtaDesc")}</p>
                <button className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                  {t("contact.learnHajiz")}
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
