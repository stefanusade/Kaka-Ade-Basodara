import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getProjects } from "@/services/posts.service";
import { resolveMediaUrl } from "@/lib/media";
import ErrorState from "@/components/common/ErrorState";
import { ApiError } from "@/services/types/api.types";

export const metadata: Metadata = {
  title: "Projects",
  description: "A selection of our recent web, hosting, IoT, and branding work.",
};

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof getProjects>>["data"] = [];
  let error: string | null = null;

  try {
    const res = await getProjects(50);
    projects = res.data;
  } catch (e) {
    error =
      e instanceof ApiError && e.status === 404
        ? "No projects published yet."
        : "We're updating this section — please check back shortly.";
  }

  return (
    <main className="px-6 pb-24 pt-32">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">Our Projects</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          A selection of platforms, systems, and products we've built for our clients.
        </p>

        {error ? (
          <ErrorState message={error} />
        ) : projects.length === 0 ? (
          <p className="mt-10 text-slate-500">No projects published yet.</p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.slug}`}>
                <article className="group h-full overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-card">
                  <div className="relative aspect-video bg-slate-100">
                    <Image
                      src={resolveMediaUrl(project.image)}
                      alt={project.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
                      {project.category} · {project.year}
                    </span>
                    <h2 className="mt-2 font-semibold text-slate-900 group-hover:text-blue-600">
                      {project.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
