import Link from "next/link";
import { Server, Code2, Cpu, Palette } from "lucide-react";
import FadeIn from "@/components/common/FadeIn";

const services = [
  {
    icon: Server,
    title: "Hosting",
    desc: "Reliable, high-uptime infrastructure with proactive monitoring and support.",
  },
  {
    icon: Code2,
    title: "Web Development",
    desc: "Fast, scalable websites and web apps built on modern frameworks.",
  },
  {
    icon: Cpu,
    title: "B2B IoT Development",
    desc: "Custom IoT systems that connect your hardware and business data.",
  },
  {
    icon: Palette,
    title: "Branding & Design",
    desc: "Visual identity and design systems that build lasting trust.",
  },
];

export default function Services() {
  return (
    <section id="services" aria-labelledby="services-heading" className="bg-white px-6 py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="services-heading" className="text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-100">
            Everything Your Business Needs, Under One Roof
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Four core disciplines, one accountable partner.
          </p>
          <Link
            href="/services"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            View all services <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <FadeIn key={service.title} delay={i * 0.08}>
              <article className="group h-full rounded-2xl border border-slate-200 p-6 transition-colors hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-800 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10">
                <service.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{service.desc}</p>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
