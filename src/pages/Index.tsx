import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import HeroSection from "@/components/home/HeroSection";
import PopularDestinations from "@/components/home/PopularDestinations";
import FeaturedHotels from "@/components/home/FeaturedHotels";
import WhyBookSection from "@/components/home/WhyBookSection";
import CustomerReviews from "@/components/home/CustomerReviews";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import MobileAppSection from "@/components/home/MobileAppSection";
import TrustSection from "@/components/home/TrustSection";
import FinalCTA from "@/components/home/FinalCTA";
import { useI18n } from "@/lib/i18n";

const Index = () => {
  const { lang } = useI18n();

  return (
    <Layout>
      <HeroSection />
      <PopularDestinations />
      <FeaturedHotels />

      {/* Join Naity CTA Banner */}
      <section className="py-14 bg-gradient-to-br from-primary/5 via-background to-blue-500/5">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-start">
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                {lang === "ar" ? "🏨 عندك فندق أو 🏠 شقة سياحية؟" : "🏨 Own a Hotel or 🏠 Apartment?"}
              </h2>
              <p className="text-muted-foreground max-w-xl">
                {lang === "ar"
                  ? "انضم إلى Naity واستقبل حجوزات مباشرة من الزبائن. إدارة كاملة من لوحة تحكم خاصة بك، بدون عمولات مرتفعة."
                  : "Join Naity and start receiving direct bookings. Full control from your own dashboard, no high commissions."}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm text-muted-foreground">
                <span>✅ {lang === "ar" ? "إشعار فوري بكل حجز" : "Instant booking notifications"}</span>
                <span>✅ {lang === "ar" ? "لوحة تحكم مجانية" : "Free dashboard"}</span>
                <span>✅ {lang === "ar" ? "دفع إلكتروني آمن" : "Secure online payment"}</span>
              </div>
            </div>
            <Link to="/join"
              className="shrink-0 gradient-cta text-primary-foreground font-bold px-8 py-4 rounded-2xl text-base shadow-lg hover:opacity-90 transition-all hover:-translate-y-0.5 whitespace-nowrap">
              {lang === "ar" ? "انضم إلينا ←" : "Join Us →"}
            </Link>
          </div>
        </div>
      </section>

      <WhyBookSection />
      <CustomerReviews />
      <HowItWorksSection />
      <MobileAppSection />
      <TrustSection />
      <FinalCTA />
    </Layout>
  );
};

export default Index;
