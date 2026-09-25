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

// Post type "information" — daftar kontak ada di sini, ditandai term "contact"
// pada taxonomy "category". Diverifikasi terhadap CMS live: fields { label, value }.
export interface RawInformationFields {
  label: string;
  value: string;
}

export type RawInformation = RawPost<RawInformationFields, { category?: string[] }>;

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

export type ContactKind = "email" | "whatsapp" | "phone" | "link" | "text";

export interface ContactInfo {
  id: number;
  label: string;
  value: string;
  kind: ContactKind;
  /** Tautan siap klik (mailto:, tel:, wa.me, atau URL) — null bila bukan tautan. */
  href: string | null;
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[\d\s()+-]+$/;

/** Normalisasi nomor Indonesia: 0858… → 62858… (dipakai untuk wa.me dan tel). */
function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

/**
 * Ubah label + value dari CMS menjadi tautan yang bisa diklik.
 * CMS tidak menyimpan tipe kontak, jadi label yang membedakan WhatsApp dari
 * telepon biasa (mis. "Whatsapp (Text Only)" vs "Phone").
 */
export function toContactLink(label: string, value: string): Pick<ContactInfo, "kind" | "href"> {
  const trimmed = value.trim();

  if (!trimmed) return { kind: "text", href: null };
  if (EMAIL_PATTERN.test(trimmed)) return { kind: "email", href: `mailto:${trimmed}` };
  if (/^https?:\/\//i.test(trimmed)) return { kind: "link", href: trimmed };

  if (PHONE_PATTERN.test(trimmed)) {
    const phone = normalizePhone(trimmed);
    if (phone.length >= 8) {
      const isWhatsApp = /whats?app|\bwa\b/i.test(label);
      return isWhatsApp
        ? { kind: "whatsapp", href: `https://wa.me/${phone}` }
        : { kind: "phone", href: `tel:+${phone}` };
    }
  }

  return { kind: "text", href: null };
}

export function mapContact(raw: RawInformation): ContactInfo {
  const label = raw.fields.label ?? "";
  const value = raw.fields.value ?? "";

  return { id: raw.id, label, value, ...toContactLink(label, value) };
}
