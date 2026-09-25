import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBlogPostById } from "@/services/posts.service";
import { resolveMediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/utils";
import PageHero from "@/components/common/PageHero";
import { ApiError } from "@/services/types/api.types";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const post = await getBlogPostById(params.id);
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
    const post = await getBlogPostById(params.id);

    return (
      <main>
        <PageHero eyebrow={formatDate(post.publishedAt)} title={post.title} />

        <div className="px-6 py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Image
                src={resolveMediaUrl(post.image)}
                alt={post.title}
                fill
                sizes="768px"
                className="object-cover"
                priority
              />
            </div>

            <p className="mt-8 leading-relaxed text-slate-700 dark:text-slate-300">{post.excerpt}</p>
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
