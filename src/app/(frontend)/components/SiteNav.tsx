"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/archive", label: "Archive" },
  { href: "/podcast", label: "Podcast" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/subscribe", label: "Subscribe" },
];

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export default function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const isCurrent = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  // Escape closes the mobile menu and returns focus to its toggle.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMobileOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 bg-obsidian">
      <nav aria-label="Primary">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className={`block shrink-0 ${focusRing}`}>
            <Image src="/logo-new.png" alt="Transformidable home" width={800} height={200} className="h-16 w-auto md:h-20" priority />
          </Link>
          <div className="hidden items-center gap-6 md:flex lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                className={`text-xs font-medium uppercase tracking-[0.2em] text-parchment/70 transition-colors hover:text-gold aria-[current=page]:text-gold ${focusRing}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4 md:hidden">
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex flex-col gap-1.5 p-2 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-gold"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              <span aria-hidden="true" className={`block h-0.5 w-6 bg-parchment transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span aria-hidden="true" className={`block h-0.5 w-6 bg-parchment transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
              <span aria-hidden="true" className={`block h-0.5 w-6 bg-parchment transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </button>
          </div>
        </div>
        <div id="mobile-nav" hidden={!mobileOpen} className="border-t border-parchment/10 px-6 pb-6 md:hidden">
          <div className="flex flex-col gap-4 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                className={`text-xs font-medium uppercase tracking-[0.2em] text-parchment/70 aria-[current=page]:text-gold ${focusRing}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
