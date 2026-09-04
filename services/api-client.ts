import { ApiError, type ApiEnvelope, type PostType, AUTH_REQUIRED_TYPES } from "./types/api.types";

const BASE_URL = process.env.CMS_BASE_URL ?? "https://cms.kakaadebasodara.com/api/v1";
const API_KEY = process.env.CMS_API_KEY;

interface FetchOptions {
  /** e.g. { per_page: 6, page: 1, category: 'iot' } */
  params?: Record<string, string | number | boolean | undefined>;
  /** Next.js ISR revalidation window in seconds. Default 3600 (1hr). */
  revalidate?: number;
  /** Opt into request-time tags for on-demand revalidation via webhooks */
  tags?: string[];
}

function buildQueryString(params?: FetchOptions["params"]): string {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.append(key, String(value));
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

function requiresAuth(postType: string): boolean {
  return (AUTH_REQUIRED_TYPES as readonly string[]).includes(postType);
}

function buildHeaders(postType: string): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (requiresAuth(postType)) {
    if (!API_KEY) {
      throw new ApiError(401, "Unauthorized", `Missing CMS_API_KEY for protected type "${postType}"`);
    }
    headers["X-API-Key"] = API_KEY;
  }
  return headers;
}

/**
 * Generic CMS collection fetcher. Scales to any post type without new code —
 * call fetchCollection<RawTestimonial>('testimonial') and it just works.
 * Returns the raw envelope; map raw -> clean UI types in the calling service.
 */
export async function fetchCollection<TRaw>(
  postType: PostType,
  options: FetchOptions = {}
): Promise<ApiEnvelope<TRaw[]>> {
  const { params, revalidate = 3600, tags } = options;
  const url = `${BASE_URL}/${postType}${buildQueryString(params)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: buildHeaders(postType),
      next: { revalidate, tags },
    });
  } catch {
    throw new ApiError(0, "Network Error", `Failed to reach CMS at ${url}`);
  }

  if (!res.ok) {
    throw new ApiError(res.status, res.statusText, `Failed fetching "${postType}"`);
  }

  const json = (await res.json()) as ApiEnvelope<TRaw[]>;

  if (!json.success) {
    throw new ApiError(500, "API Error", `CMS reported failure for "${postType}"`);
  }

  return json;
}

/**
 * Single-item fetch. The CMS only accepts numeric ids for this endpoint:
 * GET /{postType}/{id}. See scripts/check-cms.mjs to re-verify if the
 * CMS shape ever changes.
 */
export async function fetchSingle<TRaw>(
  postType: PostType,
  idOrSlug: string | number,
  options: Omit<FetchOptions, "params"> = {}
): Promise<TRaw> {
  const { revalidate = 3600, tags } = options;
  const url = `${BASE_URL}/${postType}/${idOrSlug}`;

  let res: Response;
  try {
    res = await fetch(url, { headers: buildHeaders(postType), next: { revalidate, tags } });
  } catch {
    throw new ApiError(0, "Network Error", `Failed to reach CMS at ${url}`);
  }

  if (res.status === 404) {
    throw new ApiError(404, "Not Found", `"${postType}/${idOrSlug}" does not exist`);
  }
  if (!res.ok) {
    throw new ApiError(res.status, res.statusText);
  }

  const json = (await res.json()) as ApiEnvelope<TRaw>;
  if (!json.success) {
    throw new ApiError(500, "API Error", `CMS reported failure for "${postType}/${idOrSlug}"`);
  }

  return json.data;
}
