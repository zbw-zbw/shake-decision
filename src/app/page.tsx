import { HeroSection } from "@/components/HeroSection";
import { StepsSection } from "@/components/StepsSection";
import { ScenesSection } from "@/components/ScenesSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { TechSection } from "@/components/TechSection";
import { FooterSection } from "@/components/FooterSection";

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <StepsSection />
      <ScenesSection />
      <FeaturesSection />
      <TechSection />
      <FooterSection />
    </div>
  );
}
