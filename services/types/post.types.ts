import type { RawPost } from "./api.types";

// ---- Raw shapes (exactly what the CMS returns) ----
// NOTE: confirmed against a real sample response for "project".
// "blog" and "product" field names are best-guess placeholders —
// adjust RawBlogFields / RawProductFields once you see real payloads.

export interface RawProjectFields {
  title: string;
  gallery: string[] | null;
  description: string;
  project_year: number;
  featured_image: string | null;
}

export type RawProject = RawPost<RawProjectFields, { type: string[] }>;

export interface RawBlogFields {
  title: string;
  content?: string;
  excerpt?: string;
  featured_image: string | null;
}

export type RawBlog = RawPost<RawBlogFields, { category?: string[] }>;

export interface RawProductFields {
  name: string;
  short_description?: string;
  price?: string;
  featured_image: string | null;
}

export type RawProduct = RawPost<RawProductFields, { category?: string[] }>;

// ---- Clean shapes used by UI components (decoupled from CMS field naming) ----

export interface Project {
  id: number;
  title: string;
  description: string;
  year: number;
  category: string;
  image: string | null;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  publishedAt: string;
  image: string | null;
}

export interface Product {
  id: number;
  name: string;
  shortDescription: string;
  price?: string;
  image: string | null;
}

// ---- Mappers: raw CMS post -> clean UI post ----
// Centralizing this means if the CMS renames a field, only this file changes.

export function mapProject(raw: RawProject): Project {
  return {
    id: raw.id,
    title: raw.fields.title,
    description: raw.fields.description,
    year: raw.fields.project_year,
    category: raw.terms?.type?.[0] ?? "general",
    image: raw.fields.featured_image,
  };
}

export function mapBlog(raw: RawBlog): BlogPost {
  return {
    id: raw.id,
    title: raw.fields.title,
    excerpt: raw.fields.excerpt ?? raw.fields.content?.slice(0, 160) ?? "",
    publishedAt: raw.created_at,
    image: raw.fields.featured_image,
  };
}

export function mapProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    name: raw.fields.name,
    shortDescription: raw.fields.short_description ?? "",
    price: raw.fields.price,
    image: raw.fields.featured_image,
  };
}
