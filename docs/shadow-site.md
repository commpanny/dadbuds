# Shadow Site

The shadow site lets simulation agents operate the real DadBuds product flows
without muddying the pilot database.

## Runtime Split

| Surface | URL | Database |
| --- | --- | --- |
| Real local site | `http://127.0.0.1:5175` | `backend/dadbuds.db` |
| Shadow sim site | `http://127.0.0.1:5176` | `backend/dadbuds-shadow.db` |

The shadow frontend is started with `VITE_SHADOW_MODE=true` and shows a visible
banner. The shadow backend is started with `SHADOW_MODE=true` and reports that
flag from `/health`.

## Start Shadow Runtime

```bash
npm run seed:shadow
npm run api:shadow
npm run dev:shadow
```

`seed:shadow` creates local tables, copies the first local pilot profile as the
human participant, resets shadow-only interaction state, and seeds recurring
plans. It does not copy real conversation messages, RSVPs, bud relationships,
safety reports, crews, availability windows, messages, or simulation runs.

## Operating Rule

Simulation agents should only write to the shadow API at
`http://127.0.0.1:8011`.

Do not run browser-driving agents against `http://127.0.0.1:5175` unless the
intent is to test the real local pilot database.

The `/sim` page is shadow-only. On the real local site it shows the shadow
startup commands instead of calling simulation endpoints.
