import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const BLOG_DIR = path.join(ROOT_DIR, "blog");

const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const DATASET = process.env.SANITY_DATASET || "production";
const API_VERSION = process.env.SANITY_API_VERSION || "2025-01-01";
const TOKEN = process.env.SANITY_READ_TOKEN;
const SITE_BASE_URL = (process.env.BLOG_BASE_URL || "https://example.com").replace(/\/+$/, "");

if (!PROJECT_ID) {
  throw new Error("Missing SANITY_PROJECT_ID environment variable.");
}

const POSTS_QUERY = `*[
  _type == "post" &&
  defined(slug.current) &&
  !(_id in path("drafts.**"))
] | order(coalesce(publishDate, _createdAt) desc) {
  title,
  "slug": slug.current,
  excerpt,
  publishDate,
  seoTitle,
  seoDescription,
  "coverImageUrl": coverImage.asset->url,
  body[]{
    ...,
    _type == "image" => {
      ...,
      "imageUrl": asset->url
    }
  }
}`;

async function fetchSanityPosts() {
  const endpoint = new URL(`https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`);
  endpoint.searchParams.set("query", POSTS_QUERY);

  const headers = { Accept: "application/json" };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  const response = await fetch(endpoint, { headers });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Sanity query failed (${response.status}): ${details}`);
  }

  const payload = await response.json();
  return Array.isArray(payload?.result) ? payload.result : [];
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function resolveTextWithMarks(block) {
  const children = Array.isArray(block?.children) ? block.children : [];
  const markDefs = Array.isArray(block?.markDefs) ? block.markDefs : [];
  const defsByKey = new Map(markDefs.map((def) => [def._key, def]));

  return children
    .map((child) => {
      const text = escapeHtml(child?.text || "");
      const marks = Array.isArray(child?.marks) ? child.marks : [];

      return marks.reduce((acc, mark) => {
        if (mark === "strong") return `<strong>${acc}</strong>`;
        if (mark === "em") return `<em>${acc}</em>`;
        if (mark === "code") return `<code>${acc}</code>`;
        const def = defsByKey.get(mark);
        if (def?._type === "link" && def.href) {
          const href = escapeHtml(def.href);
          return `<a href="${href}" target="_blank" rel="noopener noreferrer">${acc}</a>`;
        }
        return acc;
      }, text);
    })
    .join("");
}

function renderPortableText(body = []) {
  const blocks = Array.isArray(body) ? body : [];
  const rendered = [];
  let listContext = null;

  const closeList = () => {
    if (!listContext) return;
    rendered.push(`</${listContext.type}>`);
    listContext = null;
  };

  for (const block of blocks) {
    if (block?._type === "block" && block?.listItem) {
      const listType = block.listItem === "number" ? "ol" : "ul";
      if (!listContext || listContext.type !== listType) {
        closeList();
        rendered.push(`<${listType}>`);
        listContext = { type: listType };
      }
      rendered.push(`<li>${resolveTextWithMarks(block)}</li>`);
      continue;
    }

    closeList();

    if (block?._type === "block") {
      const style = block.style || "normal";
      const content = resolveTextWithMarks(block);
      if (!content.trim()) continue;

      if (/^h[1-6]$/.test(style)) {
        rendered.push(`<${style}>${content}</${style}>`);
      } else if (style === "blockquote") {
        rendered.push(`<blockquote>${content}</blockquote>`);
      } else {
        rendered.push(`<p>${content}</p>`);
      }
      continue;
    }

    if (block?._type === "image" && block?.imageUrl) {
      const src = escapeHtml(block.imageUrl);
      const alt = escapeHtml(block.alt || "");
      rendered.push(`<figure><img src="${src}" alt="${alt}" loading="lazy" decoding="async"></figure>`);
    }
  }

  closeList();
  return rendered.join("\n");
}

function layoutTemplate({ title, description, canonicalUrl, content }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:type" content="article">
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #090909;
      color: #f5f2ea;
      line-height: 1.6;
    }
    main { max-width: 900px; margin: 0 auto; padding: 32px 20px 80px; }
    a { color: #c9a96b; }
    .home-link { display: inline-block; margin-bottom: 18px; }
    .post-card {
      display: block;
      border: 1px solid rgba(201, 169, 107, 0.4);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
      text-decoration: none;
      color: inherit;
      background: rgba(255, 255, 255, 0.03);
    }
    .post-card h2 { margin: 0 0 8px; font-size: 1.3rem; }
    .post-card p { margin: 0; opacity: 0.9; }
    .post-date { margin-bottom: 8px; color: #c9a96b; font-size: 0.95rem; }
    img { width: 100%; height: auto; border-radius: 8px; display: block; }
    figure { margin: 24px 0; }
    article h1 { margin: 0 0 8px; line-height: 1.2; }
    article h2, article h3 { margin-top: 28px; line-height: 1.3; }
    article p, article li { font-size: 1.05rem; }
    article blockquote {
      margin: 20px 0;
      padding-left: 14px;
      border-left: 3px solid #c9a96b;
      color: rgba(245, 242, 234, 0.9);
    }
    .empty-state {
      border: 1px dashed rgba(245, 242, 234, 0.35);
      border-radius: 8px;
      padding: 20px;
    }
  </style>
</head>
<body>
  <main>${content}</main>
</body>
</html>`;
}

async function writeBlogIndex(posts) {
  const cards = posts
    .map((post) => {
      const slug = slugify(post.slug);
      const title = escapeHtml(post.title || "Untitled post");
      const excerpt = escapeHtml(post.excerpt || "Read the full article.");
      const date = formatDate(post.publishDate);
      return `<a class="post-card" href="/blog/${slug}/">
  <h2>${title}</h2>
  ${date ? `<div class="post-date">${escapeHtml(date)}</div>` : ""}
  <p>${excerpt}</p>
</a>`;
    })
    .join("\n");

  const content = `
<a class="home-link" href="/">← Back to main site</a>
<h1>Blog</h1>
${cards || '<div class="empty-state">No posts published yet.</div>'}
`;

  const html = layoutTemplate({
    title: "Blog | Naty",
    description: "Latest updates and stories from Naty.",
    canonicalUrl: `${SITE_BASE_URL}/blog/`,
    content
  });

  await mkdir(BLOG_DIR, { recursive: true });
  await writeFile(path.join(BLOG_DIR, "index.html"), html, "utf8");
}

async function writeBlogPosts(posts) {
  for (const post of posts) {
    const slug = slugify(post.slug);
    if (!slug) continue;

    const postDir = path.join(BLOG_DIR, slug);
    const readableDate = formatDate(post.publishDate);
    const title = post.seoTitle || post.title || "Untitled post";
    const description = post.seoDescription || post.excerpt || "Read this post on Naty's blog.";
    const cover = post.coverImageUrl
      ? `<figure><img src="${escapeHtml(post.coverImageUrl)}" alt="${escapeHtml(post.title || "Blog cover image")}" loading="lazy" decoding="async"></figure>`
      : "";

    const body = renderPortableText(post.body || []);
    const content = `
<a class="home-link" href="/blog/">← Back to blog</a>
<article>
  <h1>${escapeHtml(post.title || "Untitled post")}</h1>
  ${readableDate ? `<div class="post-date">${escapeHtml(readableDate)}</div>` : ""}
  ${cover}
  ${body}
</article>
`;

    const html = layoutTemplate({
      title,
      description,
      canonicalUrl: `${SITE_BASE_URL}/blog/${slug}/`,
      content
    });

    await mkdir(postDir, { recursive: true });
    await writeFile(path.join(postDir, "index.html"), html, "utf8");
  }
}

async function main() {
  const posts = await fetchSanityPosts();
  await writeBlogIndex(posts);
  await writeBlogPosts(posts);
  console.log(`Blog build complete. Generated ${posts.length} post(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
