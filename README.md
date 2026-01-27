# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Image Safety Moderation (OpenAI + Supabase)

This repo now gates all innovation images (cover + gallery) through an OpenAI moderation edge function before they become public.

- Buckets: `temp-uploads` (private, pending scans), `quarantine-uploads` (private, rejected copies), existing `innovations` bucket holds approved/public files.
- Database: new `media_assets` table tracks `{kind, bucket, path, status, moderation_result, user_id, innovation_id}` with RLS (owners only).

## Recommended innovation matching (Problems → Innovations)

- New Supabase edge functions: `upsert-problem-embedding` (problem vector sync) and `generate-problem-innovation-matches` (vector search + heuristic re-rank + cache).
- Database: `problems.embedding` (vector), cached results in `problem_innovation_matches`, refresh throttling in `problem_match_refresh_state`; RPC `match_innovations_published` powers vector search (pgvector hnsw).
- Env required for functions: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY_TEXT` (for embeddings).
- Triggering: client calls matching after problem create/update; enterprise users can hit “Refresh recommendations” in the Solutions tab (rate limited to once every 10 minutes, refreshes last ~20 recent problems) and the UI reads only from the cached matches table for fast loads.
- Edge Function: `moderate-image` creates a signed URL, calls `omni-moderation-latest`, rejects unsafe images, moves approved ones to `innovations`, deletes temp files, and logs results.
- Frontend: Innovator Media section shows per-image status chips (Scanning/Approved/Rejected/Error), blocks submit if cover not approved or any gallery pending, and offers “Retry scan” on transient errors.

### Setup / Deployment
1) Apply migrations (buckets + media_assets):
```
supabase db push
```
2) Set Supabase Edge secrets (dashboard or CLI):
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
3) Deploy the function:
```
supabase functions deploy moderate-image --project-ref <PROJECT_REF>
```
4) Local serve for testing:
```
supabase functions serve moderate-image --env-file supabase/.env.local
```
5) Frontend uses the existing `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`; the OpenAI key never leaves the server.

### UX rules
- Cover image must be approved; submission is blocked while pending/rejected.
- Gallery images show status; rejected ones are removed automatically, and errors expose “Retry scan.”
- Only approved images are persisted to the innovation record; pending/error assets are ignored on submit.
