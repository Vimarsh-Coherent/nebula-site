"use client";

import { useState } from "react";
import MagneticButton from "@/components/ui/MagneticButton";
import { cn } from "@/lib/utils";

/**
 * Contact form (Phase 1: front-end only — no backend wired yet).
 * On submit it shows a success state. Hook up an API route / email service later.
 */
export default function ContactForm() {
  const [sent, setSent] = useState(false);

  const field =
    "w-full rounded-xl border border-border bg-surface/40 px-4 py-3.5 text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-accent";

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-surface/40 p-10 text-center">
        <h3 className="font-display text-2xl font-medium">Thanks — got it.</h3>
        <p className="mt-3 text-muted">
          We&apos;ll be in touch within one business day.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true); // TODO Phase 3: POST to /api/contact or an email service.
      }}
      className="grid gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-muted">
          Name
          <input name="name" required placeholder="Jane Doe" className={field} />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          Email
          <input
            name="email"
            type="email"
            required
            placeholder="jane@company.com"
            className={field}
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm text-muted">
        About your idea
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Tell us what you're trying to build…"
          className={cn(field, "resize-none")}
        />
      </label>
      <div className="mt-2">
        <MagneticButton type="submit">Send message</MagneticButton>
      </div>
    </form>
  );
}
