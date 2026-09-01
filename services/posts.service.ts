import { fetchCollection, fetchSingle } from "./api-client";
import { mapProject, mapBlog, mapProduct } from "./types/post.types";
import type {
  RawProject,
  RawBlog,
  RawProduct,
  Project,
  BlogPost,
  Product,
} from "./types/post.types";

// Adding a new post type later = one function like these, ~5 lines.
// No changes needed anywhere else in the codebase.

export async function getProjects(limit = 6): Promise<{ data: Project[]; total: number }> {
  const res = await fetchCollection<RawProject>("project", {
    params: { per_page: limit },
    tags: ["projects"],
  });
  return { data: res.data.map(mapProject), total: res.meta?.total ?? res.data.length };
}

export async function getBlogPosts(limit = 3): Promise<{ data: BlogPost[]; total: number }> {
  const res = await fetchCollection<RawBlog>("blog", {
    params: { per_page: limit },
    tags: ["blog"],
  });
  return { data: res.data.map(mapBlog), total: res.meta?.total ?? res.data.length };
}

export async function getProducts(limit = 6): Promise<{ data: Product[]; total: number }> {
  const res = await fetchCollection<RawProduct>("product", {
    params: { per_page: limit },
    tags: ["products"],
  });
  return { data: res.data.map(mapProduct), total: res.meta?.total ?? res.data.length };
}

export async function getProjectBySlugOrId(idOrSlug: string | number): Promise<Project> {
  const raw = await fetchSingle<RawProject>("project", idOrSlug);
  return mapProject(raw);
}

export async function getBlogPostBySlugOrId(idOrSlug: string | number): Promise<BlogPost> {
  const raw = await fetchSingle<RawBlog>("blog", idOrSlug);
  return mapBlog(raw);
}

// Example of future scalability — a new "testimonial" type needs no auth
// and works with zero changes to api-client.ts:
// export const getTestimonials = () => fetchCollection<RawTestimonial>("testimonial");
