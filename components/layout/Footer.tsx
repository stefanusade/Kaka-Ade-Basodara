import Link from "next/link";
import NewsletterForm from "@/components/sections/NewsletterForm";
import { FOOTER_LINKS, SITE } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-6 py-16 text-slate-400">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-bold text-white">{SITE.name}</h3>
            <p className="mt-3 max-w-xs text-sm">{SITE.tagline} — hosting, web, IoT, and branding for growing businesses.</p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, items]) => (
            <nav key={heading} aria-label={heading}>
              <h4 className="text-sm font-semibold text-white">{heading}</h4>
              <ul className="mt-4 space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm hover:text-white">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-800 pt-10">
          <h4 className="text-sm font-semibold text-white">Stay in the loop</h4>
          <p className="mt-2 text-sm">Product updates and digital insights, no spam.</p>
          <div className="mt-4">
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>
            {SITE.email} · {SITE.phone}
          </p>
        </div>
      </div>
    </footer>
  );
}
