# DadBuds Security Baseline

DadBuds can be deployed from the full repo without publishing the repo contents
as long as the deploy target publishes only `dist`. The active Netlify config
does that with `publish = "dist"`.

## Current Hardening

- Static deploy security headers are configured in `netlify.toml`.
- API responses include defensive headers.
- `VITE_ADMIN_TOKEN` is not supported. Vite variables are public browser bundle
  data, so admin secrets must never use the `VITE_` prefix.
- Admin routes require `ADMIN_TOKEN` and refuse placeholder or short tokens.
- CORS is explicit. Localhost wildcard CORS is disabled in production unless
  `ALLOW_LOCAL_CORS=true`.
- Production refuses SQLite by default. Use managed Postgres with TLS.
- Email-only profile restore is disabled in production by default because it is
  not real authentication.
- Internal user/social API paths are disabled in production by default until
  server-verified sessions replace client-supplied `user_id` trust.

## Production Environment

Required:

```text
APP_ENV=production
DATABASE_URL=postgresql://...sslmode=require
ADMIN_TOKEN=<generated 32+ character secret>
FRONTEND_ORIGINS=https://dadbuds.lol,https://www.dadbuds.lol
APP_BASE_URL=https://dadbuds.lol
ALLOW_LOCAL_CORS=false
ALLOW_INSECURE_EMAIL_SIGNIN=false
ALLOW_INSECURE_INTERNAL_FEATURES=false
ALLOW_SQLITE_IN_PRODUCTION=false
SMTP_HOST=<mail provider host>
SMTP_FROM=<verified sender>
```

Recommended:

- Host the API and database on providers that encrypt at rest and enforce TLS in
  transit.
- Store secrets only in the deployment provider secret manager.
- Rotate `ADMIN_TOKEN` after sharing, demos, or suspected exposure.
- Keep the admin UI off public navigation before broader launch.
- Add automated backups before collecting real user data.
- Configure SMTP before enabling profile sign-in in production. Without SMTP,
  production sign-in links intentionally fail closed.

## Auth Gap

The old local profile restore is intentionally not production auth. Internal
features should use one of:

- Email magic links with short-lived, single-use tokens. DadBuds now has the
  backend and frontend path for this; production still needs SMTP configured.
- SMS one-time codes after Twilio is configured.
- OAuth/OIDC with a managed identity provider.

The server should reject client-supplied `user_id` values that do not match the
verified session identity.
