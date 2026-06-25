import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import Services from "@/components/sections/Services";
import Process from "@/components/sections/Process";
import Stats from "@/components/sections/Stats";
import Work from "@/components/sections/Work";
import CTA from "@/components/sections/CTA";
import Marquee from "@/components/ui/Marquee";

export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Marquee
        items={[
          "Idea to Product",
          "MVP in Weeks",
          "AI Automation",
          "Built to Scale",
        ]}
      />
      <Services />
      <Process />
      <Stats />
      <Work />
      <Marquee
        items={["Let's Build", "Ship Fast", "Stay Human", "Think Big"]}
        baseDuration={30}
      />
      <CTA />
    </>
  );
}
