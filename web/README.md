# pratidhwani-web

Frontend for **Pratidhwani — Predictive Carbon-Aware Serverless Gateway**.
Vite + React + TypeScript, served by hardened nginx, deployed as a single
static container on Cloud Run.

Routes:

| Path | Purpose |
|---|---|
| `/` | Live dashboard — counters, region cards, decision feed, weight sliders |
| `/sim` | 24-hour replay simulator — kicks off `/api/v1/sim/replay` and watches it stream |
| `/pitch` | Web slide deck (arrow-key navigable, overview grid, presenter mode) |
| `/report` | Full B.Tech capstone report — printable to A4 PDF |
| `/admin` | Outbound link to PocketBase admin (env `VITE_PB_URL`) |

## Local development

```bash
cd web
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`. Set `API_URL` to point the Vite
proxy at the backend (defaults to `http://localhost:8080`):

```bash
API_URL=http://localhost:8080 npm run dev
```

If the API is unreachable, the dashboard, /pitch, and /sim fall back to demo
numbers so screenshots still look real.

## Production build

```bash
npm run build      # writes dist/ — < 350 KB initial JS gzip
npm run preview    # smoke-test the dist locally
```

## Container

```bash
docker build -t pratidhwani-web:dev .
docker run --rm -p 8080:8080 \
  -e API_URL=https://pratidhwani-api-xxxx-as.a.run.app \
  -e PB_URL=https://pratidhwani-db-xxxx-as.a.run.app \
  pratidhwani-web:dev
```

`entrypoint.sh` runs `envsubst` on `nginx.conf.template` at startup, so
`API_URL` and `PB_URL` are baked into both the `/api` `proxy_pass` directive
and the CSP `connect-src` allowlist.

## Cloud Run deploy

`deploy.sh` wraps `gcloud run deploy` with the right flags:

```bash
API_URL=https://pratidhwani-api-xxxx-as.a.run.app \
PB_URL=https://pratidhwani-db-xxxx-as.a.run.app \
./deploy.sh
```

Or directly:

```bash
gcloud run deploy pratidhwani-web \
  --source . --region=asia-south1 --allow-unauthenticated \
  --set-env-vars=API_URL=<api>,PB_URL=<pb> \
  --memory=256Mi --cpu=1 --min-instances=0 --max-instances=10 --concurrency=200
```

## Swapping region URLs

The frontend never hardcodes API/PB URLs — they're read from container env at
runtime via the nginx template. To re-point the frontend at staging:

```bash
gcloud run services update pratidhwani-web --region=asia-south1 \
  --update-env-vars=API_URL=https://staging-api.example.com
```

## Accessibility

- WCAG 2.2 AAA target. Two high-contrast themes; focus rings on all
  interactive elements; full keyboard navigation; ARIA labels on regions, the
  decision feed, the slide deck, and the report TOC.
- `prefers-reduced-motion` short-circuits all framer-motion transitions.
- `/pitch` arrow-key handler skips events from form fields so weight sliders
  on the embedded dashboard never collide with deck navigation.

## Bundle budget

| Chunk | Target | Gating |
|---|---|---|
| Initial (dashboard route) | ≤ 350 KB gzip | enforced via `manualChunks` in `vite.config.ts` |
| `/pitch`, `/report`, `/sim` | lazy | `React.lazy` |
| `recharts` | lazy on dashboard | dynamic import in `TrafficSpark` |

Run `npm run build` and inspect `dist/assets/*.js.gz` (or use `du -sh`) to
verify before deploy.
