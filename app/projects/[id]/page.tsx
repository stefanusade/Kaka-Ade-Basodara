import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProjectById } from "@/services/posts.service";
import { resolveMediaUrl } from "@/lib/media";
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
      <main className="px-6 pb-24 pt-32">
        <article className="mx-auto max-w-3xl">
          <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
            {project.category} · {project.year}
          </span>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">{project.title}</h1>

          <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl bg-slate-100">
            <Image
              src={resolveMediaUrl(project.image)}
              alt={project.title}
              fill
              sizes="768px"
              className="object-cover"
              priority
            />
          </div>

          <p className="mt-8 text-slate-700 leading-relaxed">{project.description}</p>
        </article>
      </main>
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound();
    }
    throw e;
  }
}
