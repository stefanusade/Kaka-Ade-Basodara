import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectById } from "@/services/posts.service";
import { resolveMediaUrl } from "@/lib/media";
import PageHero from "@/components/common/PageHero";
import ProjectGallery from "@/components/sections/ProjectGallery";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/services/types/api.types";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const project = await getProjectById(params.id);
    return {
      title: project.title,
      description: project.description.slice(0, 160),
    };
  } catch {
    return { title: "Project" };
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  try {
    const project = await getProjectById(params.id);

    return (
      <main>
        <PageHero eyebrow={`${project.category} · ${project.year}`} title={project.title} />

        <div className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Image
                src={resolveMediaUrl(project.image)}
                alt={project.title}
                fill
                sizes="(max-width: 1152px) 100vw, 1152px"
                className="object-cover"
                priority
              />
            </div>

            <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
              <article className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100">
                  About this project
                </h2>
                <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300">
                  {project.description}
                </p>
              </article>

              <aside className="space-y-8">
                <dl className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-slate-500 dark:text-slate-400">Category</dt>
                    <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {project.category}
                    </dd>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <dt className="text-sm text-slate-500 dark:text-slate-400">Year</dt>
                    <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {project.year}
                    </dd>
                  </div>
                </dl>

                <Button asChild className="w-full">
                  <Link href="/contact">Discuss a similar project</Link>
                </Button>

                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  <span aria-hidden>←</span> All projects
                </Link>
              </aside>
            </div>

            {project.gallery.length > 0 && (
              <section aria-labelledby="gallery-heading" className="mt-16">
                <h2
                  id="gallery-heading"
                  className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100"
                >
                  Gallery
                </h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  Screens and details from this project.
                </p>

                <div className="mt-8">
                  <ProjectGallery
                    images={project.gallery.map((path) => resolveMediaUrl(path))}
                    title={project.title}
                  />
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound();
    }
    throw e;
  }
}
