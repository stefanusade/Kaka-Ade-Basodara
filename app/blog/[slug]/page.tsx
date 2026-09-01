import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBlogPostBySlugOrId } from "@/services/posts.service";
import { resolveMediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/utils";
import { ApiError } from "@/services/types/api.types";

/**
 * IMPORTANT: same caveat as app/projects/[slug]/page.tsx — confirm the real
 * single-post endpoint shape with the CMS before relying on this route.
 */

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const post = await getBlogPostBySlugOrId(params.slug);
    return {
      title: post.title,
      description: post.excerpt.slice(0, 160),
    };
  } catch {
    return { title: "Article" };
  }
}

export default async function BlogDetailPage({ params }: Props) {
  try {
    const post = await getBlogPostBySlugOrId(params.slug);

    return (
      <main className="px-6 pb-24 pt-32">
        <article className="mx-auto max-w-3xl">
          <time dateTime={post.publishedAt} className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {formatDate(post.publishedAt)}
          </time>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">{post.title}</h1>

          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100">
            <Image
              src={resolveMediaUrl(post.image)}
              alt={post.title}
              fill
              sizes="768px"
              className="object-cover"
              priority
            />
          </div>

          <p className="mt-8 text-slate-700 leading-relaxed">{post.excerpt}</p>
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
