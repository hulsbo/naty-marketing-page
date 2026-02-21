# First Blog Post: Step-by-Step Guide

Use this guide to publish your first post from Sanity and verify the full GitHub Actions flow works.

## 0) Prerequisites

- You have admin access to:
  - the GitHub repo
  - your Sanity project
- These files already exist in this repo:
  - `scripts/build-blog.mjs`
  - `.github/workflows/build-blog.yml`
  - `docks/sanity/post.schema.js`

## 1) Add the Sanity schema to your Studio project

In your Sanity Studio codebase:

1. Create `schemas/post.schema.js` and paste content from `docks/sanity/post.schema.js`.
2. Register the schema in your schema entry file (often `schemaTypes` array).
3. Deploy/update Studio:
   - `sanity deploy` (if hosted Studio), or
   - restart local Studio if self-hosted.

Success check:

- In Studio, you can create a new document type called **Post**.

## 2) Create one test post in Sanity

In Sanity Studio (mobile or desktop):

1. Create a new **Post**.
2. Fill required fields:
   - `Title`
   - `Slug` (generate from title)
   - `Publish Date`
   - `Body` (add at least one paragraph)
3. Optional but recommended:
   - `Excerpt`
   - `Cover Image` (+ alt text)
   - `SEO Title`, `SEO Description`
4. Click **Publish**.

Success check:

- Post shows as published in Studio and has a valid slug.

## 3) Configure GitHub repo secrets

In GitHub -> your repo -> **Settings** -> **Secrets and variables** -> **Actions**, add:

- `SANITY_PROJECT_ID` = your project id
- `SANITY_DATASET` = `production` (or your chosen dataset)
- `SANITY_API_VERSION` = `2025-01-01`
- `BLOG_BASE_URL` = your public site URL (example: `https://natycontorsion.com`)
- `SANITY_READ_TOKEN` = only if dataset is private

Success check:

- All required secrets are visible in the Actions secrets list.

## 4) Run a manual build once

In GitHub:

1. Open **Actions** tab.
2. Open workflow **Build Blog From Sanity**.
3. Click **Run workflow**.

Success check:

- Workflow finishes green.
- Repo now contains:
  - `blog/index.html`
  - `blog/<your-slug>/index.html`

If it fails:

- Open workflow logs and check missing/incorrect secret names first.

## 5) Verify pages on the site

After your host deploys latest commit:

1. Open `https://your-domain.com/blog/`
2. Open `https://your-domain.com/blog/<your-slug>/`
3. Confirm:
   - Post title/excerpt/content is visible
   - Cover image renders
   - Meta title/description exist in page source

## 6) Connect auto-rebuild from Sanity publish

Create a webhook in Sanity that calls GitHub Repository Dispatch:

- URL: `https://api.github.com/repos/<owner>/<repo>/dispatches`
- Method: `POST`
- Headers:
  - `Accept: application/vnd.github+json`
  - `Authorization: Bearer <github_pat_with_repo_access>`
  - `Content-Type: application/json`
- JSON body:

```json
{
  "event_type": "sanity-content-updated"
}
```

Set webhook filter so it triggers for post publish/update/unpublish events.

Success check:

- Publish or update a post in Sanity.
- A new GitHub Actions run starts automatically.

## 7) End-to-end test (final)

Do this exact test:

1. Edit your published post title in Sanity.
2. Publish.
3. Wait for Actions workflow to complete.
4. Open `/blog/` and the post page.
5. Confirm the updated title appears.

If yes, the pipeline is complete and working.

## 8) Common issues

- **No posts generated**
  - Check post `_type` is `post`, slug exists, and it is published (not draft).
- **Workflow fails on Sanity request**
  - Verify `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION`, and token permissions (if private dataset).
- **Pages generated but not live**
  - Your hosting deploy step may still need to pull latest commit or rebuild static output.
- **Webhook not triggering workflow**
  - Confirm PAT permissions and request body uses `event_type: sanity-content-updated`.

## 9) Phone-only author checklist

Use this quick flow each time you publish from phone:

1. Open your Studio URL in mobile browser and log in.
2. Tap **Post** -> **Create new**.
3. Fill:
   - `Title`
   - `Slug` (tap generate from title)
   - `Publish Date` (keep now unless scheduling)
   - `Excerpt` (1-2 short sentences)
4. Tap **Cover Image** -> upload from gallery/camera.
5. Fill image `Alt text` (what is in the photo).
6. In `Body`, write the post and add extra images if needed.
7. Optional SEO:
   - `SEO Title`
   - `SEO Description`
8. Tap **Publish**.
9. Wait 1-3 minutes for GitHub Actions + hosting deploy.
10. Open:
    - `https://your-domain.com/blog/`
    - `https://your-domain.com/blog/<slug>/`

If the post is not visible after a few minutes, check GitHub Actions run status first.
