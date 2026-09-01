import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/services/types/post.types";
import { resolveMediaUrl } from "@/lib/media";
import ErrorState from "@/components/common/ErrorState";

export default function ProjectsShowcase({
  projects,
  error,
}: {
  projects: Project[];
  error: string | null;
}) {
  return (
    <section id="projects" aria-labelledby="projects-heading" className="bg-slate-50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between">
          <h2 id="projects-heading" className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Recent Work
          </h2>
          <Link href="/projects" className="text-sm font-medium text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        {error ? (
          <ErrorState message={error} />
        ) : projects.length === 0 ? (
          <p className="mt-10 text-slate-500">No projects published yet.</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
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
                  <h3 className="mt-2 font-semibold text-slate-900">{project.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                    {project.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
