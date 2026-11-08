import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-obsidian">
      <div className="mx-auto max-w-5xl px-6">
        <div className="h-px bg-gold/30" aria-hidden="true" />
      </div>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Link href="/" className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            <Image src="/logo-new.png" alt="Transformidable home" width={800} height={200} className="h-16 w-auto md:h-20" />
          </Link>
          <nav aria-label="Footer" className="flex items-center gap-6 md:gap-8">
            <Link href="/archive" className="text-xs font-medium uppercase tracking-[0.15em] text-parchment/80 transition-colors hover:text-gold focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-gold">
              Archive
            </Link>
            <Link href="/about" className="text-xs font-medium uppercase tracking-[0.15em] text-parchment/80 transition-colors hover:text-gold focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-gold">
              About
            </Link>
            <Link href="/subscribe" className="text-xs font-medium uppercase tracking-[0.15em] text-parchment/80 transition-colors hover:text-gold focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-gold">
              Subscribe
            </Link>
            <Link href="/contact" className="text-xs font-medium uppercase tracking-[0.15em] text-parchment/80 transition-colors hover:text-gold focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-gold">
              Contact
            </Link>
          </nav>
        </div>
        <div className="mt-8 text-center sm:text-left">
          <p className="text-xs text-gold/80">
            &copy; {year} Transformidable LLC.
          </p>
        </div>
      </div>
    </footer>
  );
}
