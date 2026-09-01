# Kaka Ade Basodara — Landing Page

Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion.

## Getting started

```bash
npm install
cp .env.example .env.local
# fill in CMS_API_KEY and NEXT_PUBLIC_CMS_MEDIA_URL in .env.local
npm run dev
```

Open http://localhost:3000.

## ⚠️ Before you go further — rotate your CMS API key

An API key was shared in plain text during development. Treat it as
compromised even though it's read-only, and generate a fresh one from your
CMS dashboard. Never commit `.env.local` — only `.env.example` (with no real
values) should be in version control.

## Project structure

```
app/                        Routes (App Router)
  layout.tsx                 Root layout, fonts, header/footer
  page.tsx                   Home page (Hero, Services, Projects, Blog)
  sitemap.ts / robots.ts      SEO
  blog/, projects/            List + [slug] detail routes
  api/newsletter/route.ts     Newsletter form handler (stub — wire to real provider)
components/
  ui/                         shadcn-style primitives (Button, extend as needed)
  layout/                     Header, Footer, MobileNav
  sections/                   Hero, Services, ProjectsShowcase, BlogInsights, NewsletterForm
  common/                     FadeIn (Framer Motion), ErrorState, SectionHeading
lib/
  constants.ts                Site info, nav links, footer links
  utils.ts                    cn(), formatDate()
  media.ts                    resolveMediaUrl() — CMS relative path -> full URL
services/
  api-client.ts                Generic fetchCollection/fetchSingle with auth handling
  posts.service.ts             getProjects(), getBlogPosts(), getProducts(), etc.
  types/
    api.types.ts                ApiEnvelope, ApiError, PostType
    post.types.ts                Raw CMS shapes + clean UI shapes + mappers
```

## ✅ Verified against the live CMS (2026-09-02)

1. **Auth header** — the CMS requires `X-API-Key: {key}` (Bearer is
   rejected with 401). Handled in `services/api-client.ts` → `buildHeaders()`.

2. **Media base URL** — confirmed as `https://cms.kakaadebasodara.com/files`
   (not `/storage`). Set `NEXT_PUBLIC_CMS_MEDIA_URL` accordingly; `lib/media.ts`
   already defaults to `/files`.

3. **Single-item endpoint** — confirmed: `GET /api/v1/{postType}/{id}` works
   (`fetchSingle()` in `services/api-client.ts`).

4. **Slugs are derived** from the title (`slugify()` in
   `services/types/post.types.ts`) — the `project` response has no `slug`
   field. If the CMS provides real slugs elsewhere, swap the mapper.

## ⚠️ Still open

- **`blog` fields** (`RawBlogFields`) are placeholders — the CMS currently
  has 0 blog posts, so the real payload shape is unverified. The blog
  section/pages will show "No articles published yet." until posts exist.
- **`product` type does not exist on the CMS** (404 "Content type tidak
  ditemukan."). `getProducts()` will fail if called; the type is not used on
  any page. Remove it once the CMS actually provides a `product` content
  type.

## Scaling to new post types

Adding e.g. `testimonial` or `team` requires no changes to `api-client.ts`.
Just add raw/clean types + a mapper in `post.types.ts`, then a wrapper
function in `posts.service.ts`:

```ts
export const getTestimonials = () => fetchCollection<RawTestimonial>("testimonial");
```

## Performance notes

- Only `FadeIn.tsx`, `MobileNav.tsx`, and `NewsletterForm.tsx` are client
  components (`"use client"`). Everything else — including data fetching in
  `page.tsx` — runs on the server, keeping client JS minimal.
- Images use `next/image` with `fill` + `sizes` for responsive lazy loading.
- Font loaded via `next/font/google` (self-hosted at build time, no extra
  network request, no CLS).
- Data is cached via ISR (`revalidate: 3600` default in `api-client.ts`).
  Lower this, or wire CMS webhooks to call `revalidateTag()`, if you need
  fresher content.

## Deployment

Recommended: Vercel (native ISR + image optimization). Set environment
variables (`CMS_API_KEY`, `CMS_BASE_URL`, `NEXT_PUBLIC_CMS_MEDIA_URL`,
`NEXT_PUBLIC_SITE_URL`) in the hosting provider's dashboard — never in code.

Run a production build before testing PageSpeed/Lighthouse:

```bash
npm run build && npm run start
```

Dev mode (`npm run dev`) is unoptimized and will show misleadingly worse
performance metrics.
