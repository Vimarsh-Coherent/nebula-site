import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { BRAND } from "@/lib/brand";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Cursor from "@/components/layout/Cursor";
import Grain from "@/components/layout/Grain";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import Preloader from "@/components/layout/Preloader";
import ScrollProgress from "@/components/layout/ScrollProgress";
import SiteBackground from "@/components/visuals/SiteBackground";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s — ${BRAND.name}`,
  },
  description: BRAND.description,
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    url: BRAND.url,
    siteName: BRAND.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#050608",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fontVariables} antialiased`}>
      <body className="min-h-svh bg-background text-foreground">
        {/* Dynamic backdrop: cursor-lit WebGL field + scroll-opening logo mark */}
        <SiteBackground />

        {/* First-load intro */}
        <Preloader />

        {/* Cinematic overlays + custom cursor (client, fine-pointer only) */}
        <Grain />
        <Cursor />
        <ScrollProgress />

        <Nav />

        {/* Lenis smooth scroll wraps the whole document */}
        <SmoothScroll>
          <main id="content">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
