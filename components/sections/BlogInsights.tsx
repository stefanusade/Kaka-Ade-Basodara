import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/services/types/post.types";
import { resolveMediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/utils";
import ErrorState from "@/components/common/ErrorState";

export default function BlogInsights({
  posts,
  error,
}: {
  posts: BlogPost[];
  error: string | null;
}) {
  return (
    <section id="insights" aria-labelledby="insights-heading" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between">
          <div>
            <h2 id="insights-heading" className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Insights & Updates
            </h2>
            <p className="mt-2 text-slate-600">
              Thoughts on web, hosting, IoT, and digital strategy.
            </p>
          </div>
          <Link href="/blog" className="text-sm font-medium text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        {error ? (
          <ErrorState message={error} />
        ) : posts.length === 0 ? (
          <p className="mt-10 text-slate-500">No articles published yet.</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <article className="group h-full overflow-hidden rounded-2xl border border-slate-200 transition-shadow hover:shadow-card">
                  <div className="relative aspect-[16/10] bg-slate-100">
                    <Image
                      src={resolveMediaUrl(post.image)}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <time
                      dateTime={post.publishedAt}
                      className="text-xs font-medium uppercase tracking-wide text-slate-400"
                    >
                      {formatDate(post.publishedAt)}
                    </time>
                    <h3 className="mt-2 font-semibold text-slate-900 group-hover:text-blue-600">
                      {post.title}
                    </h3>
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
    </section>
  );
}
