import type { Metadata } from "next";
import { getServiceGroups } from "@/services/posts.service";
import { ApiError } from "@/services/types/api.types";
import type { ServiceGroup } from "@/services/types/post.types";
import ErrorState from "@/components/common/ErrorState";
import FadeIn from "@/components/common/FadeIn";
import PageHero from "@/components/common/PageHero";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Hosting, web development, B2B IoT development, and branding — four core disciplines, one accountable partner.",
};

/** Label tampilan untuk term taxonomy `type` yang berupa akronim. */
const TERM_LABELS: Record<string, string> = {
  iot: "IoT",
  b2b: "B2B",
  b2c: "B2C",
  ai: "AI",
  seo: "SEO",
  ui: "UI",
  ux: "UX",
  vps: "VPS",
  api: "API",
  cdn: "CDN",
};

/** "hosting" → "Hosting", "b2b-iot" → "B2B IoT". */
function humanizeTerm(slug: string): string {
  const known = TERM_LABELS[slug.toLowerCase()];
  if (known) return known;

  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function ServicesPage() {
  let groups: ServiceGroup[] = [];
  let error: string | null = null;

  try {
    groups = await getServiceGroups();
  } catch (e) {
    error =
      e instanceof ApiError && e.status === 404
        ? "No services published yet."
        : "We're updating this section — please check back shortly.";
  }

  const total = groups.reduce((sum, group) => sum + group.services.length, 0);

  return (
    <main>
      <PageHero
        eyebrow="Services"
        title="Our Services"
        description="From the infrastructure your business runs on to the interface your customers see — pick a discipline, or let us handle the whole stack."
      />

      <div className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          {error ? (
            <ErrorState message={error} />
          ) : total === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">No services published yet.</p>
          ) : (
            <div className="space-y-16 sm:space-y-20">
              {groups.map((group) => (
                <section
                  key={group.type}
                  id={group.type}
                  aria-labelledby={`${group.type}-heading`}
                  className="scroll-mt-28"
                >
                  <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
                    <h2
                      id={`${group.type}-heading`}
                      className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100"
                    >
                      {humanizeTerm(group.type)}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {group.services.length} layanan
                    </p>
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {group.services.map((service, i) => (
                      <FadeIn key={service.id} delay={i * 0.06}>
                        <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {service.title}
                            </h3>
                            {service.popular && (
                              <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                Popular
                              </span>
                            )}
                          </div>

                          {service.pricing && (
                            <p className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {service.pricing}
                            </p>
                          )}

                          {/* Deskripsi ditulis penyunting di CMS (kelola sendiri),
                              bisa memuat HTML seperti daftar fitur. */}
                          <div
                            className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400 [&_div]:mt-3 [&_li]:mt-1 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5"
                            dangerouslySetInnerHTML={{ __html: service.description }}
                          />
                        </article>
                      </FadeIn>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
