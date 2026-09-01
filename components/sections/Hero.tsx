import Link from "next/link";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/common/FadeIn";

export default function Hero() {
  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden bg-slate-950 px-6 pt-32 pb-24 sm:pt-40 sm:pb-32"
    >
      {/* Decorative gradient, pure CSS — zero JS cost */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(37,99,235,0.25),transparent)]"
      />
      <div className="relative mx-auto max-w-4xl text-center">
        <FadeIn>
          <span className="inline-block rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1 text-sm font-medium text-blue-300">
            Trusted Digital Partner Since Day One
          </span>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            One Stop Digital Solution
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            From reliable hosting to custom web platforms, IoT systems for your
            business, and branding that sticks — Kaka Ade Basodara builds the
            digital backbone your company runs on.
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/contact">Get a Free Consultation</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/projects">View Our Work</Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
