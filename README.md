# Kaka Ade Basodara — One Stop Digital Solution

Landing page untuk **Kaka Ade Basodara**, digital agency yang menyediakan
hosting, web development, B2B IoT development, serta branding & design.
Konten (proyek dan artikel blog) diambil langsung dari headless CMS
(`https://cms.kakaadebasodara.com/api/v1`) saat halaman diminta, lalu di-cache
dengan ISR — tim marketing bisa mengelola konten dari dashboard CMS sementara
situnya tetap cepat.

## Fitur

- **Hero + Services** — intro agency dan empat lini layanan utama
- **Projects showcase** — proyek terbaru dari CMS, lengkap dengan halaman
  daftar (`/projects`) dan detail (`/projects/[id]`)
- **Blog / Insights** — artikel dari CMS, daftar (`/blog`) + detail
  (`/blog/[id]`)
- **Newsletter form** — form email yang terhubung ke API route lokal
  (`/api/newsletter`, masih stub)
- **SEO-ready** — metadata, Open Graph, `sitemap.xml`, `robots.txt`
- **Responsive** — mobile nav, layout adaptif, animasi scroll reveal
  (Framer Motion)
- **Fast by default** — server components, ISR caching, lazy-loaded images

## Tech stack

| Layer | Pilihan |
|---|---|
| Framework | Next.js 14 (App Router) |
| Bahasa | TypeScript (strict) |
| Styling | Tailwind CSS + primitif CVA/Radix |
| Animasi | Framer Motion |
| Ikon | lucide-react |
| Data | Headless CMS (`https://cms.kakaadebasodara.com/api/v1`) + ISR |

## Getting started

Prasyarat: Node.js 18.17+ (diuji pada 22.x).

```bash
npm install
cp .env.example .env.local   # lalu isi CMS_API_KEY
npm run dev
```

Buka http://localhost:3000.

## Environment variables

| Variable | Wajib | Default |
|---|---|---|
| `CMS_API_KEY` | ya — tanpa ini semua konten 401 | — |
| `CMS_BASE_URL` | tidak | `https://cms.kakaadebasodara.com/api/v1` |
| `NEXT_PUBLIC_CMS_MEDIA_URL` | tidak | `https://cms.kakaadebasodara.com/files` |
| `NEXT_PUBLIC_SITE_URL` | tidak | `https://kakaadebasodara.com` |

> **Keamanan**: `.env.local` di-gitignore dan tidak boleh di-commit. Hanya
> `.env.example` (tanpa nilai asli) yang masuk version control. Generate API
> key dari dashboard CMS — anggap key yang pernah dibagikan di luar CMS sudah
> bocor dan segera rotasi.

## Struktur proyek

```
app/                        Routes (App Router)
  layout.tsx / page.tsx      Root layout + halaman home (Hero, Services, Projects, Blog)
  projects/ + blog/          Halaman daftar + [id] detail
  sitemap.ts / robots.ts     SEO
  api/newsletter/route.ts    Handler form newsletter (stub — belum ada provider)
components/
  ui/                        Primitif shadcn-style (Button)
  layout/                    Header, Footer, MobileNav
  sections/                  Hero, Services, ProjectsShowcase, BlogInsights, NewsletterForm
  common/                    FadeIn, ErrorState, SectionHeading
lib/
  constants.ts               Info SITE, nav links, footer links
  utils.ts                   cn(), formatDate()
  media.ts                   resolveMediaUrl() — path relatif CMS → URL penuh
services/
  api-client.ts              fetchCollection() / fetchSingle() — generik, auth + ISR
  posts.service.ts           getProjects(), getBlogPosts(), getProducts(), get*ById()
  types/                     Bentuk raw CMS → bentuk clean UI (mapper)
```

## Integrasi CMS (terverifikasi terhadap CMS live, 2026-09-02)

- **Auth**: kirim header `X-API-Key: {key}`. Bearer token ditolak dengan 401
  (ditangani di `services/api-client.ts` → `buildHeaders()`).
- **Envelope**: `{ success, data, meta: { total, page, per_page, total_pages } }`.
- **Collection**: `GET /api/v1/{postType}?per_page=N` → array di `data`.
- **Single**: `GET /api/v1/{postType}/{id}` — bekerja dengan ID numerik (ini
  yang diasumsikan `fetchSingle()`).
- **Media**: CMS mengembalikan path relatif seperti `2026/09/xxxx.webp`;
  di-resolve terhadap `NEXT_PUBLIC_CMS_MEDIA_URL` (default `.../files`).
  Host gambar baru harus ditambahkan ke `next.config.mjs` →
  `images.remotePatterns`.
- **Caching**: ISR `revalidate: 3600` (1 jam) dengan request tags
  (`projects`, `blog`, `products`) untuk revalidasi on-demand via webhook.
- **Kondisi CMS saat ini**: `blog` masih **0 post** (section menampilkan "No
  articles published yet" — ini normal, bukan bug). Content type `product`
  **belum ada** di CMS (404); `getProducts()` tidak terpakai sampai ada.

### Alur data

- Fetch data berjalan di **server** (`page.tsx`) memakai `Promise.allSettled`,
  jadi satu section gagal tidak merusak halaman.
- Hanya tiga client components: `FadeIn`, `MobileNav`, `NewsletterForm`.
  Selebihnya server component agar client JS minimal.

## Menambah post type baru

Menambah mis. `testimonial` tidak butuh perubahan di `api-client.ts`. Cukup
tambah raw/clean types + mapper di `post.types.ts`, lalu wrapper di
`posts.service.ts`:

```ts
export const getTestimonials = () => fetchCollection<RawTestimonial>("testimonial");
```

## Perintah

```bash
npm run dev                              # dev server
npm run build                            # production build
npm run start                            # serve production build
npm run lint                             # ESLint
npx tsc --noEmit                         # typecheck
node --env-file=.env scripts/check-cms.mjs   # diagnosa koneksi/bentuk CMS
```

## Deployment

Rekomendasi: **Vercel** (ISR native + image optimization). Set environment
variables (`CMS_API_KEY`, `CMS_BASE_URL`, `NEXT_PUBLIC_CMS_MEDIA_URL`,
`NEXT_PUBLIC_SITE_URL`) di dashboard hosting — jangan pernah di dalam kode.

Uji production build sebelum menilai performa (PageSpeed/Lighthouse):

```bash
npm run build && npm run start
```

Mode dev (`npm run dev`) tidak teroptimasi dan akan menampilkan metrik
performa yang lebih buruk dari seharusnya.

## Batasan yang diketahui

- Route `/contact` belum ada, tetapi di-link dari CTA header, hero, dan mobile
  nav (404) — perlu dibuat atau link-nya dihapus.
- Link footer semuanya mengarah ke `#`; `SITE.phone` masih placeholder.
- `api/newsletter/route.ts` masih stub — perlu dihubungkan ke provider email
  (Mailchimp, Resend, dll.) sebelum rilis.
- URL detail project/blog memakai ID numerik CMS (mis. `/projects/2`) karena
  endpoint single CMS hanya menerima ID numerik, bukan slug.
