import Link from "next/link";
import { Button } from "@/components/ui/button";
import MobileNav from "./MobileNav";
import { NAV_LINKS, SITE } from "@/lib/constants";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-white">
          {SITE.name}
        </Link>

        <nav aria-label="Primary" className="hidden gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button asChild size="sm">
            <Link href="/contact">Get Started</Link>
          </Button>
        </div>

        <MobileNav links={NAV_LINKS} />
      </div>
    </header>
  );
}
