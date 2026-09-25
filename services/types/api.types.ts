export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message ?? `API request failed: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

// Post types that require an authenticated API key
export const AUTH_REQUIRED_TYPES = ["project", "blog", "product", "information", "service"] as const;
export type PostType = (typeof AUTH_REQUIRED_TYPES)[number] | "testimonial" | "team";

// Raw shape as returned by the CMS for any post type — generic over `fields`/`terms`
export interface RawPost<F, T = Record<string, string[]>> {
  id: number;
  status: string;
  created_at: string;
  updated_at: string;
  fields: F;
  terms: T;
}
