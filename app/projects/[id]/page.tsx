import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProjectById } from "@/services/posts.service";
import { resolveMediaUrl } from "@/lib/media";
import PageHero from "@/components/common/PageHero";
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
          <article className="mx-auto max-w-3xl">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Image
                src={resolveMediaUrl(project.image)}
                alt={project.title}
                fill
                sizes="768px"
                className="object-cover"
                priority
              />
            </div>

            <p className="mt-8 leading-relaxed text-slate-700 dark:text-slate-300">
              {project.description}
            </p>
          </article>
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
