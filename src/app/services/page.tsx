import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Services from "@/components/sections/Services";
import Process from "@/components/sections/Process";
import CTA from "@/components/sections/CTA";

export const metadata: Metadata = {
  title: "Services",
  description:
    "MVP & prototype building, solution architecture, AI automation, and team building — explained in plain English.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        label="Services"
        title="Built for non-technical teams."
        subtitle="Four ways we take you from idea to shipped product — without the jargon."
      />
      <Services />
      <Process />
      <CTA />
    </>
  );
}
