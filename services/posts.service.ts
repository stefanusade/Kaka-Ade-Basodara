import { fetchCollection, fetchSingle } from "./api-client";
import { mapProject, mapBlog, mapProduct, mapContact, mapService } from "./types/post.types";
import type {
  RawProject,
  RawBlog,
  RawProduct,
  RawInformation,
  RawService,
  Project,
  BlogPost,
  Product,
  ContactInfo,
  Service,
  ServiceGroup,
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

export async function getProjectById(id: string | number): Promise<Project> {
  const raw = await fetchSingle<RawProject>("project", id);
  return mapProject(raw);
}

/** Term pada taxonomy `category` yang menandai sebuah entri sebagai kontak. */
const CONTACT_TERM = "contact";

/**
 * Daftar kontak dari post type `information`, disaring ke term `contact`.
 *
 * CMS TIDAK mendukung filter taxonomy lewat query string — parameter seperti
 * `category=`, `term=`, maupun `filter[...]=` diabaikan (diverifikasi langsung
 * ke CMS: term yang tidak ada tetap mengembalikan semua item), jadi penyaringan
 * term dilakukan di sini.
 */
export async function getContactInfo(): Promise<ContactInfo[]> {
  const res = await fetchCollection<RawInformation>("information", {
    params: { per_page: 50 },
    tags: ["information"],
  });

  return res.data
    .filter((item) => (item.terms?.category ?? []).includes(CONTACT_TERM))
    .map(mapContact);
}

/** Term pengganti untuk layanan yang belum diberi term pada taxonomy `type`. */
const OTHER_SERVICE_TYPE = "lainnya";

/**
 * Layanan dari post type `service`, dikelompokkan per term taxonomy `type`
 * supaya tiap grup bisa dirender sebagai satu section di halaman Services.
 *
 * Section diurutkan alfabetis berdasarkan slug term (bukan urutan terbit item,
 * yang sulit dikendalikan penyunting); grup "lainnya" selalu diletakkan terakhir.
 */
export async function getServiceGroups(): Promise<ServiceGroup[]> {
  const res = await fetchCollection<RawService>("service", {
    params: { per_page: 100 },
    tags: ["services"],
  });

  const groups = new Map<string, Service[]>();

  res.data.forEach((raw) => {
    const service = mapService(raw);
    const type = service.type ?? OTHER_SERVICE_TYPE;
    const bucket = groups.get(type);

    if (bucket) bucket.push(service);
    else groups.set(type, [service]);
  });

  const sorted = [...groups]
    .filter(([type]) => type !== OTHER_SERVICE_TYPE)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, services]) => ({ type, services }));

  const others = groups.get(OTHER_SERVICE_TYPE);
  if (others) sorted.push({ type: OTHER_SERVICE_TYPE, services: others });

  return sorted;
}

export async function getBlogPostById(id: string | number): Promise<BlogPost> {
  const raw = await fetchSingle<RawBlog>("blog", id);
  return mapBlog(raw);
}

// Example of future scalability — a new "testimonial" type needs no auth
// and works with zero changes to api-client.ts:
// export const getTestimonials = () => fetchCollection<RawTestimonial>("testimonial");
