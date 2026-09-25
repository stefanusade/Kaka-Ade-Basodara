import type { MetadataRoute } from "next";
import { getProjects, getBlogPosts } from "@/services/posts.service";
import { SITE } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/projects`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE.url}/services`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE.url}/contact`, changeFrequency: "monthly", priority: 0.7 },
  ];

  try {
    const [{ data: projects }, { data: posts }] = await Promise.all([
      getProjects(100),
      getBlogPosts(100),
    ]);

    const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
      url: `${SITE.url}/projects/${p.id}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${SITE.url}/blog/${post.id}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...projectRoutes, ...blogRoutes];
  } catch {
    // If CMS is down, sitemap still returns static routes rather than failing the build
    return staticRoutes;
  }
}
