import type { Metadata } from "next";
import { getProjects, getBlogPosts } from "@/services/posts.service";
import { ApiError } from "@/services/types/api.types";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import ProjectsShowcase from "@/components/sections/ProjectsShowcase";
import BlogInsights from "@/components/sections/BlogInsights";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description:
    "Hosting, Web Development, B2B IoT Development, and Branding — all under one roof. Trusted digital partner for growing businesses.",
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description:
      "Hosting, Web Development, B2B IoT Development, and Branding — all under one roof.",
    url: SITE.url,
    siteName: SITE.name,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: "Hosting, Web Dev, B2B IoT, Branding — one trusted partner.",
  },
};

export default async function HomePage() {
  // Fetch in parallel; each is isolated so one failure doesn't break the page
  const [projectsResult, blogResult] = await Promise.allSettled([
    getProjects(3),
    getBlogPosts(3),
  ]);

  const projects = projectsResult.status === "fulfilled" ? projectsResult.value.data : [];
  const blogPosts = blogResult.status === "fulfilled" ? blogResult.value.data : [];

  const projectsError =
    projectsResult.status === "rejected" ? describeError(projectsResult.reason) : null;
  const blogError = blogResult.status === "rejected" ? describeError(blogResult.reason) : null;

  return (
    <main>
      <Hero />
      <Services />
      <ProjectsShowcase projects={projects} error={projectsError} />
      <BlogInsights posts={blogPosts} error={blogError} />
    </main>
  );
}

function describeError(reason: unknown): string {
  if (reason instanceof ApiError) {
    return reason.status === 404
      ? "No content published yet."
      : "We're updating this section — please check back shortly.";
  }
  return "Something went wrong loading this section.";
}
