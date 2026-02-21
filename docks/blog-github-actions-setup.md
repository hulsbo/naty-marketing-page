# Blog Setup (Sanity + GitHub Actions)

This project now includes:

- static blog generator script: `scripts/build-blog.mjs`
- generated output folder: `blog/`
- GitHub Actions workflow: `.github/workflows/build-blog.yml`

## 1) Sanity content model (minimum)

In your Sanity Studio project, create a `post` schema with these fields:

- `title` (string, required)
- `slug` (slug, required, source: title)
- `excerpt` (text)
- `coverImage` (image)
- `publishDate` (datetime)
- `seoTitle` (string)
- `seoDescription` (text)
- `body` (array of portable text blocks + image blocks)

The build script expects `_type == "post"` and `slug.current`.

## 2) Set GitHub repository secrets

In GitHub -> Repo -> Settings -> Secrets and variables -> Actions, add:

- `SANITY_PROJECT_ID` = your Sanity project id
- `SANITY_DATASET` = usually `production`
- `SANITY_API_VERSION` = e.g. `2025-01-01`
- `BLOG_BASE_URL` = your site URL, e.g. `https://natycontorsion.com`
- `SANITY_READ_TOKEN` = optional (only needed if dataset is private)

If your Sanity dataset is public, `SANITY_READ_TOKEN` can be omitted.

## 3) Test locally before CI

Run:

```bash
SANITY_PROJECT_ID=xxx \
SANITY_DATASET=production \
SANITY_API_VERSION=2025-01-01 \
BLOG_BASE_URL=https://natycontorsion.com \
node scripts/build-blog.mjs
```

This generates:

- `blog/index.html`
- `blog/<slug>/index.html`

## 4) Enable automatic rebuild on publish

This workflow runs on:

- push to `master`
- manual trigger (`workflow_dispatch`)
- external dispatch event `sanity-content-updated`

To trigger from Sanity after publish/unpublish, configure a webhook in Sanity that calls GitHub's repository dispatch API:

- URL: `https://api.github.com/repos/<owner>/<repo>/dispatches`
- Method: `POST`
- Headers:
  - `Accept: application/vnd.github+json`
  - `Authorization: Bearer <github_pat_with_repo_access>`
  - `Content-Type: application/json`
- Body:

```json
{
  "event_type": "sanity-content-updated"
}
```

Use Sanity's filter to trigger only for blog post create/update/delete/publish events.

## 5) Deployment behavior

The workflow:

1. checks out the repo
2. runs `node scripts/build-blog.mjs`
3. commits changes under `blog/` (if any)
4. pushes back to `master`

Your static hosting should then publish the updated `/blog` pages from the repo.

## 6) Notes

- Blog styles are embedded in generated pages to keep this integration minimal.
- The portable text renderer supports headings, paragraphs, links, bold/italic/code, lists, blockquotes, and images.
- For richer design later, migrate generated pages to shared CSS/templates.
