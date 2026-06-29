# Deployment Pipelines

DadBuds uses separate build targets so shadow simulation work cannot accidentally
ship to the public landing page.

## Branches

| Branch | Purpose | Build command | Public surface |
| --- | --- | --- | --- |
| `main` | Production landing page | `npm run build:landing` | Landing, join, thanks, how-it-works, standard |
| `shadow` | Shadow sim frontend | `npm run build:shadow` | Full app with shadow banner and sim routes |
| future prod app branch or flipped `main` | Real app production | `npm run build:prod-app` | Full app, no shadow mode |

Netlify contexts in `netlify.toml` keep all deploy previews and ordinary branch
deploys on the safe landing build. Only the `shadow` branch uses the shadow build.

## Required Netlify Settings

Production site:

- Production branch: `main`
- Build command: read from `netlify.toml`
- Publish directory: `dist`

Shadow sim site:

- Enable branch deploys for `shadow`, or create a separate Netlify site pointed
  at the `shadow` branch.
- Set `VITE_API_URL` to the hosted shadow API URL.
- Do not set `VITE_API_URL` to localhost in Netlify.

The `build:shadow` and `build:prod-app` scripts fail if `VITE_API_URL` is
missing or points at localhost. This prevents a deployed app from calling a local
API that only exists on a developer machine.

## Build Targets

```bash
npm run build:landing
npm run build:shadow
npm run build:prod-app
```

For local shadow runtime, keep using:

```bash
npm run seed:shadow
npm run api:shadow
npm run dev:shadow
```

## Production Push Guard

Install the local hook once per checkout:

```bash
npm run hooks:install
```

Normal pushes to `main` or `master` are blocked. After local validation and
explicit approval, use:

```bash
DADBUDS_ALLOW_PROD_PUSH=1 git push origin main
```

This guard does not block pushing a `shadow` branch.

## Future Real App Production

When the full app is ready for production:

1. Configure hosted production API and database.
2. Set production `VITE_API_URL`.
3. Change the production Netlify context from `npm run build:landing` to
   `npm run build:prod-app`.
4. Keep `VITE_SHADOW_MODE=false`.
5. Run one approved production push.
