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

const Index = () => (
  <Layout>
    <HeroSection />
    <PopularDestinations />
    <FeaturedHotels />
    <WhyBookSection />
    <CustomerReviews />
    <HowItWorksSection />
    <MobileAppSection />
    <TrustSection />
    <FinalCTA />
  </Layout>
);

export default Index;
