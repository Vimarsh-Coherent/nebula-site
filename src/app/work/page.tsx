import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Work from "@/components/sections/Work";
import Stats from "@/components/sections/Stats";
import CTA from "@/components/sections/CTA";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected products we've shipped for small and non-technical businesses.",
};

export default function WorkPage() {
  return (
    <>
      <PageHeader
        label="Work"
        title="Things we've shipped."
        subtitle="A selection of products, automations, and systems we've built. Placeholder case studies for now — real ones drop in here."
      />
      <Work />
      <Stats />
      <CTA />
    </>
  );
}
