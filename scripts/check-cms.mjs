// Diagnostic: verifies CMS connectivity, envelope shape, single-item endpoint,
// and media URL resolution. Run with:  node --env-file=.env scripts/check-cms.mjs
const BASE = process.env.CMS_BASE_URL ?? "https://cms.kakaadebasodara.com/api/v1";
const KEY = process.env.CMS_API_KEY;
const MEDIA = process.env.NEXT_PUBLIC_CMS_MEDIA_URL ?? "https://cms.kakaadebasodara.com/files";

const headers = { "Content-Type": "application/json", "X-API-Key": KEY };

async function get(path, h = headers) {
  const res = await fetch(`${BASE}${path}`, { headers: h });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

function summarizeItem(raw) {
  if (!raw) return "  (no items)";
  return [
    `  id: ${raw.id}`,
    `  status: ${raw.status}`,
    `  created_at: ${raw.created_at}`,
    `  fields: ${JSON.stringify(raw.fields)}`,
    `  terms: ${JSON.stringify(raw.terms)}`,
  ].join("\n");
}

async function checkMedia(path) {
  if (!path || !path.startsWith("http")) return "  (relative — resolved by lib/media.ts at render)";
  try {
    const res = await fetch(path, { method: "HEAD" });
    return `  media HEAD ${res.status} ${res.statusText} — ${path}`;
  } catch {
    return `  media FAILED — ${path}`;
  }
}

if (!KEY) console.log("⚠️  CMS_API_KEY is MISSING in .env — all protected types will throw 401.\n");

const [proj, blog, prod] = await Promise.all([
  get("/project?per_page=2"),
  get("/blog?per_page=2"),
  get("/product?per_page=2"),
]);

for (const [label, res] of [
  ["/project?per_page=2", proj],
  ["/blog?per_page=2", blog],
  ["/product?per_page=2", prod],
]) {
  console.log(`=== ${label} ===`);
  console.log("status:", res.status);
  if (res.json?.success) {
    console.log("meta:", JSON.stringify(res.json.meta));
    console.log("count:", res.json.data.length);
    console.log(summarizeItem(res.json.data[0]));
  } else {
    console.log(JSON.stringify(res.json));
  }
  console.log();
}

// Verify the assumed single-item endpoint shape: /{postType}/{id}
const firstProject = proj.json?.success ? proj.json.data[0] : null;
if (firstProject) {
  const single = await get(`/project/${firstProject.id}`);
  console.log(`=== GET /project/${firstProject.id} (fetchSingle assumption) ===`);
  console.log("status:", single.status);
  console.log(
    single.json?.success ? summarizeItem(single.json.data) : JSON.stringify(single.json)
  );
  console.log();

  const media = firstProject.fields?.featured_image ?? null;
  if (media) {
    console.log(`=== media check (first project image) ===`);
    console.log(`  raw path: ${media}`);
    console.log(await checkMedia(media.startsWith("http") ? media : `${MEDIA}/${media}`));
  }
}
