# Cloudflare Pages Deployment

DadBuds public launch should deploy as a static Cloudflare Pages site with one Pages Function for intake submissions.

## Project settings

- Repository: `commpanny/dadbuds`
- Production branch: `main`
- Root directory: leave blank
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `VITE_FULL_APP=false`

## Intake storage

The public join form posts to `/api/join`. That route is handled by `functions/api/join.ts` and stores submissions in a KV namespace binding.

Create a KV namespace:

- Name: `dadbuds_leads`

Add a Pages binding:

- Binding name: `DADBUDS_LEADS`
- Binding type: KV namespace
- Namespace: `dadbuds_leads`

If the binding is missing, `/api/join` returns HTTP 500 instead of silently losing leads.

## Public routes

The public launch build exposes:

- `/`
- `/join`
- `/how-it-works`
- `/join/signup`
- `/join/thanks`
- `/standard`

The full app routes stay behind `VITE_FULL_APP=true`.

## Headers and SPA fallback

Cloudflare Pages reads:

- `public/_headers`
- `public/_redirects`

Vite copies both files into `dist` during `npm run build`.

## Cutover

1. In Netlify, stop automatic Git deploys for the existing DadBuds site before pushing more commits to `main`.
2. Push this repo to GitHub so Cloudflare can build the current Cloudflare-ready version.
3. Deploy a Cloudflare Pages preview.
4. Submit a test lead at `/join/signup`.
5. Confirm a KV record appears under `DADBUDS_LEADS`.
6. Move `dadbuds.lol` DNS/custom domain to Cloudflare Pages.
7. Leave Netlify parked or remove the Netlify project after DNS has fully moved.

The repo still contains `netlify.toml` so old deploy history remains readable. Cloudflare ignores that file.
