# AI Outbound Autopilot — System Context

> Paste this file at the start of every new AI chat to restore full context instantly.

---

## What This App Does

SaaS lead discovery and AI outreach automation platform. It scrapes local businesses from Google Maps (and Apify fallback), scores them as sales opportunities, and generates personalized outreach. Target users are B2B sales teams prospecting local service businesses (HVAC, roofing, med spas, solar, etc.).

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS v4, Lucide icons |
| Database | Supabase (Postgres + PostgREST) |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| Hosting | Vercel (Hobby plan) |
| Scraping | Google Places API (native) + Apify fallback |

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_MAPS_API_KEY
```

All must be set in Vercel → Settings → Environment Variables.

---

## Database Schema (Supabase)

### `companies`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto |
| name | text NOT NULL | |
| place_id | text UNIQUE | Google Maps place ID — conflict key for upserts |
| city | text | |
| state | text | |
| website | text | |
| phone | text | |
| rating | float | |
| review_count | int | |
| niche | text | keyword used to find this business |
| source | text | `google-native` / `apify` |
| opportunity_score | int | 0–100, computed by scoring engine |
| opportunity_tier | text | `hot` / `warm` / `cold` |
| opportunity_reason | text | human-readable explanation |
| recommended_offer | text | |
| recommended_next_step | text | |
| lead_volume_score | int | sub-score |
| followup_gap_score | int | sub-score |
| local_visibility_score | int | sub-score |
| offer_fit_score | int | sub-score |
| created_at | timestamptz | |

**Key constraint:** `UNIQUE (place_id)` — full constraint (not partial index) required for PostgREST ON CONFLICT.

### `discovery_jobs`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text NOT NULL | e.g. `"HVAC — Phoenix"` |
| source | text | `google-native` |
| niche | text | |
| city | text | |
| state | text | |
| status | text | `completed` / `failed` |
| results_count | int | |
| created_at | timestamptz | |

### `discovery_queue`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| keyword | text | search term |
| city | text | |
| state | text | |
| industry | text | |
| max_results | int DEFAULT 60 | |
| status | text | `pending` / `running` / `completed` / `failed` |
| error_message | text | |
| started_at | timestamptz | |
| completed_at | timestamptz | |
| results_count | int | |
| created_at | timestamptz | |

**Key constraint:** `UNIQUE (keyword, city, state)` — prevents duplicate queue entries.

### `scrape_results_raw`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| source | text | `maps` |
| external_id | text | place_id |
| raw_payload | jsonb | full scraped record |
| created_at | timestamptz | |

### `api_usage_log`
Tracks cost per API call. Columns: provider, service, feature, input_units, output_units, estimated_cost, status, metadata, created_at.

---

## API Routes

### Companies
| Route | Method | Description |
|---|---|---|
| `/api/companies` | GET | All companies ordered by opportunity_score desc |
| `/api/companies/list` | GET | All companies ordered by created_at desc, limit 500 |
| `/api/companies/score` | POST | Bulk-score all companies and write scores back to Supabase |
| `/api/companies/save` | POST | Upsert `leads[]` array to companies (conflict on place_id) |
| `/api/companies/[id]/intelligence` | GET | Pre-computed AI intelligence for a company |
| `/api/companies/analyze` | POST | Run full AI intelligence pipeline on a company payload |

### Discovery
| Route | Method | Description |
|---|---|---|
| `/api/discovery` | POST | Main dispatcher — routes to google-places or apify based on `source` field. Auto-saves to Supabase. |
| `/api/discovery/queue` | GET | Queue status summary (pending/running/completed/failed counts) |
| `/api/discovery/queue` | POST | Bulk-seed discovery_queue: `{ industry, keywords[], cities[], state, maxResults }` |
| `/api/discovery/sources/maps` | POST | Direct Google Maps source connector |
| `/api/discovery/sources/apify` | POST | Direct Apify source connector |

### Workers
| Route | Method | Description |
|---|---|---|
| `/api/workers/discovery` | GET | Cron worker: claims next pending job from discovery_queue, runs Google Places, upserts companies, marks completed |

### System
| Route | Method | Description |
|---|---|---|
| `/api/system/usage` | GET | Aggregated API cost/usage metrics |

---

## Discovery Flow

### Manual (from UI)
```
User fills form → POST /api/discovery → runGooglePlacesDiscovery()
  → Google Places API (up to 60 results, 3 pages)
  → if < 50% returned → Apify fallback (mock in dev, real actor in prod)
  → upsert to companies (onConflict: place_id, ignoreDuplicates: true)
  → insert to scrape_results_raw
  → insert to discovery_jobs
  → return leads to UI → UI refreshes company table
```

### Queue Worker (cron, daily at 9am UTC)
```
GET /api/workers/discovery (triggered by Vercel Cron)
  → SELECT next pending job from discovery_queue
  → mark as running
  → runMapsSource() → Google Places
  → upsert to companies
  → insert to scrape_results_raw
  → logUsage()
  → mark as completed
```

### Seeding the Queue
```bash
curl -X POST https://your-app.vercel.app/api/discovery/queue \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "hvac",
    "keywords": ["HVAC contractor", "air conditioning repair"],
    "cities": ["Phoenix", "Scottsdale", "Tempe"],
    "state": "AZ",
    "maxResults": 60
  }'
```

---

## Scoring Engine

**File:** `lib/scoring/opportunity-score.ts`

Four sub-scores (total = sum, max ~100+):
- `leadVolumeScore` — based on review_count (proxy for lead flow)
- `followupGapScore` — missing website/phone = opportunity
- `localVisibilityScore` — high rating + reviews + contact info
- `offerFitScore` — niche match (roofing/solar/med spa/HVAC score highest)

**Tiers:**
- `hot` ≥ 75
- `warm` ≥ 45
- `cold` < 45

**To score all companies:**
```bash
curl -X POST https://your-app.vercel.app/api/companies/score
```

Requires these columns in `companies` table:
```sql
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS lead_volume_score      integer,
  ADD COLUMN IF NOT EXISTS followup_gap_score     integer,
  ADD COLUMN IF NOT EXISTS local_visibility_score integer,
  ADD COLUMN IF NOT EXISTS offer_fit_score        integer,
  ADD COLUMN IF NOT EXISTS opportunity_score      integer,
  ADD COLUMN IF NOT EXISTS opportunity_tier       text,
  ADD COLUMN IF NOT EXISTS opportunity_reason     text,
  ADD COLUMN IF NOT EXISTS recommended_offer      text,
  ADD COLUMN IF NOT EXISTS recommended_next_step  text;
```

---

## Dashboard Pages

| Route | Description |
|---|---|
| `/prospecting` | Run discovery jobs + view/search all companies from Supabase |
| `/companies` | Company grid/list view with tier filter, real data from Supabase |
| `/companies/[id]` | Individual company detail — currently uses mock data |
| `/command-center` | Hub page |
| `/demo-studio` | AI demo context + message generation |
| `/outreach` | Campaign management |
| `/pipeline` | Sales pipeline |
| `/system-health` | API usage + cost tracking |

**Pages still using mock data:** `/companies/[id]`, `/pipeline`, `/outreach`, `/demo-studio`, `/command-center`

---

## Key Lib Files

| File | Purpose |
|---|---|
| `lib/supabase/server.ts` | `supabaseAdmin` client (uses SERVICE_ROLE_KEY) |
| `lib/discovery/google-places.ts` | Hybrid orchestrator: Google Places → Apify fallback |
| `lib/discovery/sources/maps.ts` | `runMapsSource()` — called by queue worker |
| `lib/discovery/sources/apify.ts` | Apify connector (mock in dev) |
| `lib/maps/google-places.ts` | Raw Google Places Text Search with pagination |
| `lib/scoring/opportunity-score.ts` | `scoreOpportunity()` function |
| `lib/usage/cost-tracker.ts` | `logUsage()` — writes to api_usage_log |
| `lib/mock-data.ts` | Mock leads + companies (still used by some pages) |

---

## Known Issues / TODO

- [ ] `/companies/[id]` detail page still uses mock data — needs real Supabase fetch
- [ ] `/pipeline`, `/outreach`, `/demo-studio` pages use mock data
- [ ] Vercel Hobby plan limits cron to once/day (`0 9 * * *`) — upgrade to Pro for per-minute
- [ ] Apify is mocked in dev — real actor `compass/google-maps-scraper` needs `APIFY_API_TOKEN` env var
- [ ] `niche` column in companies only populated on new discovery runs (existing rows have null)
- [ ] Export button on prospecting page is UI-only (no CSV download yet)
- [ ] AI Prospect + Enrich buttons are UI-only stubs

---

## Vercel Cron

```json
// vercel.json
{
  "crons": [{ "path": "/api/workers/discovery", "schedule": "0 9 * * *" }]
}
```

Hobby plan: max 1 execution/day. Pro plan: can run `* * * * *` (every minute).

---

## Common SQL Migrations Run So Far

```sql
-- Required for upsert to work (full constraint, not partial index)
ALTER TABLE companies ADD CONSTRAINT companies_place_id_key UNIQUE (place_id);

-- Required for queue deduplication
ALTER TABLE discovery_queue
  ADD COLUMN IF NOT EXISTS max_results integer NOT NULL DEFAULT 60;
ALTER TABLE discovery_queue
  ADD CONSTRAINT discovery_queue_keyword_city_state_key UNIQUE (keyword, city, state);

-- Required for niche/source tracking
ALTER TABLE companies ADD COLUMN IF NOT EXISTS niche text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS source text;

-- Required for scoring
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS lead_volume_score      integer,
  ADD COLUMN IF NOT EXISTS followup_gap_score     integer,
  ADD COLUMN IF NOT EXISTS local_visibility_score integer,
  ADD COLUMN IF NOT EXISTS offer_fit_score        integer,
  ADD COLUMN IF NOT EXISTS opportunity_score      integer,
  ADD COLUMN IF NOT EXISTS opportunity_tier       text,
  ADD COLUMN IF NOT EXISTS opportunity_reason     text,
  ADD COLUMN IF NOT EXISTS recommended_offer      text,
  ADD COLUMN IF NOT EXISTS recommended_next_step  text;
```
