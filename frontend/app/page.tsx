import { Navbar } from "@/components/layout/navbar";
import { CoverageAreaSection } from "@/components/layout/sections/coverage";
import { FAQSection } from "@/components/layout/sections/faq";
import { FooterSection } from "@/components/layout/sections/footer";
import { HeroSection } from "@/components/layout/sections/hero";
import { LogoMarqueeSection } from "@/components/layout/sections/logo";
import { PricingSection } from "@/components/layout/sections/pricing";
import { ProblemsSection } from "@/components/layout/sections/problems";


export default function Home() {
  return (
    <>
    <Navbar/>
      <HeroSection />
      <ProblemsSection/>
      <PricingSection />
      <CoverageAreaSection />
      {/* <FeaturesSection/> */}
      <LogoMarqueeSection/>
      <FAQSection />
      <FooterSection />
    </>
  );
}
