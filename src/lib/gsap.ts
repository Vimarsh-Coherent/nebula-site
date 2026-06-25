/**
 * Central GSAP entry point. Import { gsap, ScrollTrigger, SplitText } from here
 * so plugins are registered exactly once. Registration is guarded for SSR.
 *
 * Note: GSAP (incl. ScrollTrigger & SplitText) is fully free as of v3.13.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

export { gsap, ScrollTrigger, SplitText };
