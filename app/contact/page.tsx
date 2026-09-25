import type { Metadata } from "next";
import { Globe, Info, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import { getContactInfo } from "@/services/posts.service";
import { ApiError } from "@/services/types/api.types";
import type { ContactInfo, ContactKind } from "@/services/types/post.types";
import ErrorState from "@/components/common/ErrorState";
import FadeIn from "@/components/common/FadeIn";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to Kaka Ade Basodara about hosting, web development, B2B IoT, or branding — via WhatsApp, email, or a free consultation.",
};

const CONTACT_ICONS: Record<ContactKind, LucideIcon> = {
  email: Mail,
  whatsapp: MessageCircle,
  phone: Phone,
  link: Globe,
  text: Info,
};

/** Alamat lebih tepat ditandai ikon lokasi daripada ikon tipe tautannya. */
function iconForContact({ kind, label }: ContactInfo): LucideIcon {
  if (/alamat|address|lokasi|location|kantor|office|maps/i.test(label)) return MapPin;
  return CONTACT_ICONS[kind];
}

const CARD_CLASS =
  "group flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition-colors dark:border-slate-800 dark:bg-slate-900";

export default async function ContactPage() {
  let contacts: ContactInfo[] = [];
  let error: string | null = null;

  try {
    contacts = await getContactInfo();
  } catch (e) {
    error =
      e instanceof ApiError && e.status === 404
        ? "No contact information published yet."
        : "We're updating this section — please check back shortly.";
  }

  return (
    <main className="px-6 pb-24 pt-32">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Let&apos;s Talk</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
          Tell us about your project — hosting, web development, B2B IoT, or branding. Pick whichever
          channel you prefer; we usually reply within one business day.
        </p>

        {error ? (
          <ErrorState message={error} />
        ) : contacts.length === 0 ? (
          <p className="mt-10 text-slate-500 dark:text-slate-400">
            No contact channels published yet.
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {contacts.map((contact, i) => {
              const Icon = iconForContact(contact);
              const isExternal = contact.kind === "whatsapp" || contact.kind === "link";

              const card = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">
                      {contact.label}
                    </span>
                    <span className="mt-1 block break-words font-semibold text-slate-900 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                      {contact.value}
                    </span>
                  </span>
                </>
              );

              return (
                <FadeIn key={contact.id} delay={i * 0.08}>
                  {contact.href ? (
                    <a
                      href={contact.href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className={`${CARD_CLASS} hover:border-blue-300 dark:hover:border-blue-500/40`}
                    >
                      {card}
                    </a>
                  ) : (
                    <div className={CARD_CLASS}>{card}</div>
                  )}
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
