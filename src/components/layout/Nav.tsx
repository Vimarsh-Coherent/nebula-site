"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BRAND, NAV_LINKS } from "@/lib/brand";
import { cn } from "@/lib/utils";
import MagneticButton from "@/components/ui/MagneticButton";
import RollText from "@/components/ui/RollText";
import TextScramble from "@/components/ui/TextScramble";

/**
 * Sticky top navigation. Transparent over the hero, then gains a blurred
 * surface backdrop once the user scrolls. Includes a full-screen mobile menu.
 */
export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Defer the initial read out of the effect body (avoids sync setState).
    const id = requestAnimationFrame(onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(id);
    };
  }, []);

  // Close the mobile menu on route change (deferred to avoid sync setState).
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled
          ? "border-b border-border bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-18 max-w-(--container-max) items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2 text-lg font-semibold tracking-tight"
          aria-label={`${BRAND.name} — home`}
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_16px_var(--accent)] transition-transform duration-300 group-hover:scale-125" />
          <TextScramble trigger="mount" scrambleOnHover speed={30}>
            {BRAND.name}
          </TextScramble>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  data-cursor
                  className={cn(
                    "group relative block text-sm text-muted transition-colors duration-300 hover:text-foreground",
                    active && "text-foreground",
                  )}
                >
                  <RollText>{link.label}</RollText>
                  <span
                    className={cn(
                      "absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100",
                      active && "scale-x-100",
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden md:block">
          <MagneticButton href="/contact" className="px-5 py-2.5 text-sm">
            Start your MVP
          </MagneticButton>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="relative z-50 flex h-10 w-10 items-center justify-center md:hidden"
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1.5">
            <span
              className={cn(
                "h-px w-6 bg-foreground transition-transform duration-300",
                open && "translate-y-[3.5px] rotate-45",
              )}
            />
            <span
              className={cn(
                "h-px w-6 bg-foreground transition-transform duration-300",
                open && "-translate-y-[3.5px] -rotate-45",
              )}
            />
          </div>
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col justify-center gap-2 bg-background px-8 md:hidden"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i + 0.1, duration: 0.4 }}
              >
                <Link
                  href={link.href}
                  className="font-display text-5xl font-medium tracking-tight"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * NAV_LINKS.length + 0.1, duration: 0.4 }}
              className="mt-8"
            >
              <MagneticButton href="/contact">Start your MVP</MagneticButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
