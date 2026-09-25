import type { ReactNode } from "react";

/**
 * Hero/jumbotron untuk halaman dalam (Projects, Insights, Contact, detail).
 *
 * Sengaja selalu berlatar gelap — sama seperti hero beranda — supaya semua
 * halaman punya pembuka yang konsisten di mode terang maupun gelap. Konten
 * di bawahnya bebas memakai varian `dark:`.
 */
export default function PageHero({
  eyebrow,
  title,
  description,
  align = "left",
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  children?: ReactNode;
}) {
  const centered = align === "center";

  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 pb-16 pt-32 sm:pb-20 sm:pt-40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(37,99,235,0.25),transparent)]"
      />
      <div className={`relative mx-auto max-w-6xl ${centered ? "text-center" : ""}`}>
        {eyebrow && (
          <span className="inline-block rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1 text-sm font-medium text-blue-300">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
        {description && (
          <p className={`mt-4 text-lg text-slate-300 ${centered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
