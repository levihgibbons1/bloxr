import dynamic from "next/dynamic";
import Hero from "@/components/Hero";

const Problem = dynamic(() => import("@/components/Problem"));
const HowItWorks = dynamic(() => import("@/components/HowItWorks"));
const Features = dynamic(() => import("@/components/Features"));
const Marketplace = dynamic(() => import("@/components/Marketplace"));
const Pricing = dynamic(() => import("@/components/Pricing"));
const CTA = dynamic(() => import("@/components/CTA"));
const Footer = dynamic(() => import("@/components/Footer"));

export default function Home() {
  return (
    <main>
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <Marketplace />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
