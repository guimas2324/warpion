import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HeroSection } from "@/components/public/HeroSection";
import { FeaturesSection } from "@/components/public/FeaturesSection";
import { EngineSection } from "@/components/public/EngineSection";
import { ProvidersSection } from "@/components/public/ProvidersSection";
import { PricingPreviewSection } from "@/components/public/PricingPreviewSection";
import { SocialProofSection } from "@/components/public/SocialProofSection";
import { FinalCtaSection } from "@/components/public/FinalCtaSection";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-200">
      <PublicHeader />
      <main>
        <HeroSection isLoggedIn={Boolean(user)} />
        <FeaturesSection />
        <EngineSection />
        <ProvidersSection />
        <PricingPreviewSection />
        <SocialProofSection />
        <FinalCtaSection />
      </main>
      <PublicFooter />
    </div>
  );
}
