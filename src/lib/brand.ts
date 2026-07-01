/**
 * Single source of truth for brand + marketing copy.
 * Swap BRAND.name (and anything below) to rebrand the whole site in one place.
 */

export const BRAND = {
  name: "Orbit",
  // Short tagline used in nav / meta.
  tagline: "Idea to shipped product.",
  // Longer description used in <meta> and the footer.
  description:
    "Orbit is an AI automation studio that helps small and non-technical businesses go from idea to shipped product — MVPs, solution architecture, AI automation, and team building.",
  email: "hello@orbit.studio",
  // Used for absolute URLs / OG. Replace with the real domain at launch.
  url: "https://orbit.studio",
  socials: [
    { label: "X / Twitter", href: "https://x.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
    { label: "Instagram", href: "https://instagram.com" },
    { label: "GitHub", href: "https://github.com" },
  ],
} as const;

/** Primary nav routes. The home page is a long single-page scroll with in-page anchors. */
export const NAV_LINKS = [
  { label: "Work", href: "/work" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;
