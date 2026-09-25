"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function MobileNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="p-2 text-white"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-t border-white/10 bg-slate-950 px-6 py-6">
          <nav className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-slate-200"
              >
                {link.label}
              </Link>
            ))}
            <Button asChild className="mt-2 w-full">
              <Link href="/contact" onClick={() => setOpen(false)}>
                Get Started
              </Link>
            </Button>

            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-sm font-medium text-slate-300">Tema tampilan</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
