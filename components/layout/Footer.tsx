import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { getContactInfo } from "@/services/posts.service";
import type { ContactInfo } from "@/services/types/post.types";
import { FOOTER_LINKS, SITE } from "@/lib/constants";

/**
 * Kontak footer diambil dari CMS (post type `information`, term `contact`).
 * Kegagalan fetch tidak boleh menjatuhkan seluruh halaman — footer cukup
 * menampilkan info yang tersedia.
 */
async function getFooterContacts(): Promise<ContactInfo[]> {
  try {
    return await getContactInfo();
  } catch {
    return [];
  }
}

export default async function Footer() {
  const contacts = await getFooterContacts();

  const email = contacts.find((contact) => contact.kind === "email");
  const instant =
    contacts.find((contact) => contact.kind === "whatsapp") ??
    contacts.find((contact) => contact.kind === "phone");

  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-6 py-16 text-slate-400">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-bold text-white">{SITE.name}</h3>
            <p className="mt-3 max-w-xs text-sm">
              {SITE.tagline} — hosting, web, IoT, and branding for growing businesses.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, items]) => (
            <nav key={heading} aria-label={heading}>
              <h4 className="text-sm font-semibold text-white">{heading}</h4>
              <ul className="mt-4 space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm transition-colors hover:text-white">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>

          {(email || instant) && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {email?.href && (
                <a
                  href={email.href}
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {email.value}
                </a>
              )}

              {instant?.href && (
                <a
                  href={instant.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {instant.value}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
