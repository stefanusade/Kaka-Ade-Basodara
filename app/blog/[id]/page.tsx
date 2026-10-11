import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostById } from "@/services/posts.service";
import { resolveMediaUrl } from "@/lib/media";
import { rewriteMediaUrls } from "@/lib/html";
import { formatDate } from "@/lib/utils";
import PageHero from "@/components/common/PageHero";
import { Button } from "@/components/ui/button";
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
          <div className="mx-auto max-w-6xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Image
                src={resolveMediaUrl(post.image)}
                alt={post.title}
                fill
                sizes="(max-width: 1152px) 100vw, 1152px"
                className="object-cover"
                priority
              />
            </div>

            <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
              {/* Konten blog adalah rich text HTML dari CMS (ditulis penyunting
                  situs sendiri) — dirender apa adanya dengan gaya `prose`. */}
              <article className="prose prose-slate max-w-none lg:col-span-2 dark:prose-invert">
                {post.content ? (
                  <div dangerouslySetInnerHTML={{ __html: rewriteMediaUrls(post.content) }} />
                ) : (
                  <p>{post.excerpt}</p>
                )}
              </article>

              <aside className="space-y-8">
                <dl className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-slate-500 dark:text-slate-400">Published</dt>
                    <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatDate(post.publishedAt)}
                    </dd>
                  </div>
                </dl>

                <Button asChild className="w-full">
                  <Link href="/contact">Get a Free Consultation</Link>
                </Button>

                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  <span aria-hidden>←</span> All insights
                </Link>
              </aside>
            </div>
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
