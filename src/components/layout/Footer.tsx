import Link from "next/link";
import { BRAND, NAV_LINKS } from "@/lib/brand";
import Container from "@/components/ui/Container";
import MagneticButton from "@/components/ui/MagneticButton";

/** Site footer with a large CTA, contact, nav, and socials over a subtle glow. */
export default function Footer() {
  const year = 2026; // static to avoid hydration drift; bump as needed.

  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface/30">
      {/* Soft animated accent glow behind the footer. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/2 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]"
      />

      <Container className="relative py-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Got a project?
            </p>
            <h2 className="font-display mt-4 text-4xl font-medium sm:text-5xl">
              Let&apos;s build something
              <span className="text-accent"> worth shipping.</span>
            </h2>
            <div className="mt-8">
              <MagneticButton href={`mailto:${BRAND.email}`}>
                {BRAND.email}
              </MagneticButton>
            </div>
          </div>

          <nav className="flex gap-16">
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">
                Pages
              </p>
              <ul className="space-y-2.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      data-cursor
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">
                Social
              </p>
              <ul className="space-y-2.5">
                {BRAND.socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      data-cursor
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {BRAND.name}. {BRAND.tagline}
          </span>
          <span className="text-xs uppercase tracking-[0.2em]">
            Designed &amp; built in-house
          </span>
        </div>
      </Container>
    </footer>
  );
}
