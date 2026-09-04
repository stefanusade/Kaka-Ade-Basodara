import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogPosts } from "@/services/posts.service";
import { resolveMediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/utils";
import ErrorState from "@/components/common/ErrorState";
import { ApiError } from "@/services/types/api.types";

export const metadata: Metadata = {
  title: "Insights",
  description: "Thoughts on web development, hosting, IoT, and digital strategy.",
};

export default async function BlogPage() {
  let posts: Awaited<ReturnType<typeof getBlogPosts>>["data"] = [];
  let error: string | null = null;

  try {
    const res = await getBlogPosts(50);
    posts = res.data;
  } catch (e) {
    error =
      e instanceof ApiError && e.status === 404
        ? "No articles published yet."
        : "We're updating this section — please check back shortly.";
  }

  return (
    <main className="px-6 pb-24 pt-32">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">Insights & Updates</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Thoughts on web development, hosting, IoT, and digital strategy.
        </p>

        {error ? (
          <ErrorState message={error} />
        ) : posts.length === 0 ? (
          <p className="mt-10 text-slate-500">No articles published yet.</p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <article className="group h-full overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-card">
                  <div className="relative aspect-[16/10] bg-slate-100">
                    <Image
                      src={resolveMediaUrl(post.image)}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <time
                      dateTime={post.publishedAt}
                      className="text-xs font-medium uppercase tracking-wide text-slate-400"
                    >
                      {formatDate(post.publishedAt)}
                    </time>
                    <h2 className="mt-2 font-semibold text-slate-900 group-hover:text-blue-600">
                      {post.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                      {post.excerpt}
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
