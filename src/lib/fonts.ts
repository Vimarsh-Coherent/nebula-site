import { Space_Grotesk, Inter } from "next/font/google";

/**
 * Type system.
 *
 * - `display`  → oversized editorial headlines (geometric grotesque).
 * - `sans`     → body / UI copy.
 *
 * We start with Space Grotesk (a geometric grotesque available on Google Fonts)
 * so the project builds offline with zero asset wrangling.
 *
 * To switch to Clash Display / General Sans (free on fontshare.com):
 *   1. Drop the .woff2 files into `src/app/fonts/`.
 *   2. Replace `display` below with:
 *        import localFont from "next/font/local";
 *        export const display = localFont({
 *          src: [{ path: "../app/fonts/ClashDisplay-Variable.woff2" }],
 *          variable: "--font-display",
 *          display: "swap",
 *        });
 *   Nothing else in the app needs to change — everything reads `--font-display`.
 */

export const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/** Convenience: all font CSS-variable classes to spread onto <html>. */
export const fontVariables = `${display.variable} ${sans.variable}`;
