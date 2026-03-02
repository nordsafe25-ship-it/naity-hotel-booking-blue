import { motion } from "framer-motion";
import { Building2, Wifi, Globe, CheckCircle, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";

const steps = [
  {
    icon: Building2,
    title: "Hotels Use Hajiz",
    desc: "Hotels install the Hajiz system to manage rooms, availability, pricing, and operations internally.",
  },
  {
    icon: Wifi,
    title: "Naity Connects via API",
    desc: "Naity connects to each hotel's Hajiz system through a secure API, pulling live data in real time.",
  },
  {
    icon: Globe,
    title: "You Browse & Book",
    desc: "Only Hajiz-powered hotels appear on Naity. You get real availability, real prices, instant confirmation.",
  },
];

const HowItWorks = () => (
  <Layout>
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto mb-16 space-y-4"
        >
          <h1 className="text-4xl font-extrabold text-accent">How Naity Works</h1>
          <p className="text-muted-foreground text-lg">
            A seamless connection between hotels and travelers, powered by the Hajiz management system.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-3xl mx-auto space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex gap-6 items-start relative"
            >
              {/* Timeline */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-card">
                  <step.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 h-16 bg-border my-2" />
                )}
              </div>
              <div className="pb-12">
                <div className="text-xs font-semibold text-primary mb-1">Step {i + 1}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-card rounded-2xl p-8 shadow-card border border-border/50 max-w-2xl mx-auto"
        >
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            The Result
          </h3>
          <ul className="space-y-3 text-muted-foreground">
            {[
              "No outdated listings — data comes live from hotels",
              "No overbookings — availability is synced in real time",
              "No hidden fees — prices are set directly by the hotel",
              "Instant confirmation — bookings go straight to Hajiz",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  </Layout>
);

export default HowItWorks;
