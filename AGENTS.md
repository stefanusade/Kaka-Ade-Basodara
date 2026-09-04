# AGENTS.md

Guidance for AI agents and contributors working in this repository.

## Overview

Kaka Ade Basodara — landing page for a digital agency (hosting, web
development, B2B IoT, branding). Content is pulled from a headless CMS
(`https://cms.kakaadebasodara.com/api/v1`) at request time with ISR caching.

Stack: Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS ·
Framer Motion · lucide-react · shadcn-style primitives (CVA + Radix Slot).

## Commands

```bash
npm run dev        # dev server (http://localhost:3000)
npm run build      # production build
npm run start      # serve production build
npm run lint       # ESLint
npx tsc --noEmit   # typecheck
node --env-file=.env scripts/check-cms.mjs   # CMS connectivity/shape diagnostic
```

## Environment

Copy `.env.example` to `.env.local` and fill in values. `.env.local` must
**never** be committed (see `.gitignore`).

| Variable | Required | Default |
|---|---|---|
| `CMS_API_KEY` | yes — without it protected types throw 401 | — |
| `CMS_BASE_URL` | no | `https://cms.kakaadebasodara.com/api/v1` |
| `NEXT_PUBLIC_CMS_MEDIA_URL` | no | `https://cms.kakaadebasodara.com/files` |
| `NEXT_PUBLIC_SITE_URL` | no | `https://kakaadebasodara.com` |

Env vars are read at server startup — restart `npm run dev` after changes.

## Architecture

```
app/                        Routes (App Router)
  layout.tsx / page.tsx      Root layout + home (Hero, Services, Projects, Blog)
  projects/ + blog/          List + [id] detail pages
  sitemap.ts / robots.ts     SEO
  api/newsletter/route.ts    Newsletter stub (no provider wired yet)
components/
  ui/button.tsx              shadcn-style primitive
  layout/                    Header, Footer, MobileNav
  sections/                  Hero, Services, ProjectsShowcase, BlogInsights, NewsletterForm
  common/                    FadeIn, ErrorState, SectionHeading
lib/
  constants.ts               SITE info, nav links, footer links
  utils.ts                   cn(), formatDate()
  media.ts                   resolveMediaUrl() — relative CMS path → full URL
services/
  api-client.ts              fetchCollection() / fetchSingle() — generic, auth + ISR
  posts.service.ts           getProjects(), getBlogPosts(), getProducts(), get*ById()
  types/                     Raw CMS shapes → clean UI shapes (mappers)
```

### Data flow

- Data fetching runs on the **server** (`page.tsx`), using
  `Promise.allSettled` so one failing section never breaks the page.
- Fetch results are cached via ISR (`revalidate: 3600` default) with
  request tags (`projects`, `blog`, `products`) for on-demand revalidation.
- Only three client components: `FadeIn`, `MobileNav`, `NewsletterForm`.
  Keep it that way — everything else should stay a server component.

## CMS integration (verified against the live CMS)

- **Auth**: send `X-API-Key: {key}`. Bearer tokens are rejected with 401.
- **Envelope**: `{ success, data, meta: { total, page, per_page, total_pages } }`.
- **Collection**: `GET /api/v1/{postType}?per_page=N` → array in `data`.
- **Single**: `GET /api/v1/{postType}/{id}` — works with numeric IDs (this is
  what `fetchSingle()` assumes).
- **Media**: CMS returns relative paths like `2026/09/xxxx.webp`; resolved
  against `NEXT_PUBLIC_CMS_MEDIA_URL` (default `.../files`). New image hosts
  must be added to `next.config.mjs` → `images.remotePatterns`.
- **Current CMS state**: `blog` has **0 posts** (sections show "No articles
  published yet" — expected, not a bug). The `product` content type does
  **not exist** on the CMS (404); `getProducts()` is unused until it does.

## Conventions

- **Raw → clean mapping is centralized** in `services/types/post.types.ts`.
  If the CMS renames a field, only that file changes.
- **Adding a new post type** (e.g. `testimonial`): add raw/clean types + a
  mapper in `post.types.ts`, then a ~5-line wrapper in `posts.service.ts`.
  `api-client.ts` needs no changes.
- **Detail routes are id-based** (`/projects/[id]`, `/blog/[id]`) — the CMS
  single-item endpoint only accepts numeric ids (`GET /{postType}/{id}`), so
  URLs use the CMS numeric id, not a slug.
- **Styling**: Tailwind with theme tokens (`brand`, `ink`) from
  `tailwind.config.ts`; combine classes with `cn()` from `lib/utils`.
- **Images**: `next/image` with `fill` + `sizes` for responsive lazy loading.
- **Dates**: format via `formatDate()` (`id-ID` locale).

## Known gaps / pitfalls

- `/contact` is linked from the header CTA, hero, and mobile nav but the
  route does **not exist yet** — it 404s. Build it or remove the links.
- Footer links all point to `#`; `SITE.phone` is a placeholder.
- `api/newsletter/route.ts` is a stub — wire it to a real email provider
  before launch.
- 404 from the CMS renders "No content published yet"; other failures render
  a generic "updating this section" message (handled per-page).
- `scripts/check-cms.mjs` is the fastest way to re-verify CMS auth,
  envelope shape, or media URLs after CMS changes.
