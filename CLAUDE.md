# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a box office fantasy sports game (Shugsy, shugsy.com) where users create lineups of movies to compete based on opening weekend box office performance. Users select 2-4 movies from a weekly slate (minimum 6 movies) within a $50,000 salary cap, scoring 1 point per $1M in domestic opening weekend gross. The app includes live weekend scoring with preliminary leaderboards as box office estimates roll in Friday through Sunday.

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript (required for all files)
- **Database**: Supabase (PostgreSQL) with RLS
- **Authentication**: Supabase Auth with email/password (password required)
- **Styling**: Tailwind CSS with custom dark theme (teal accent `#4fd1c5`)
- **Rate Limiting**: Upstash Redis (optional, graceful degradation)
- **Email**: Resend (optional, graceful degradation)
- **Push Notifications**: APNs HTTP/2 (iOS, optional, graceful degradation)
- **Movie Data**: TMDB API for posters and metadata (optional)
- **Analytics**: Google Tag Manager / GA4
- **Deployment**: Vercel (Hobby plan)
- **Toast Notifications**: Sonner

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Production build (use this to verify changes compile)
- `npm run lint` - Run linting
- `supabase start` - Local database

## Project Structure

```
/app                    # Next.js App Router (pages and layouts)
  /admin               # Protected admin routes (contest + movie management)
  /account             # User dashboard, past results, reset-password
  /charts              # Public box office charts with projections/estimates
  /contests/[id]       # Contest overview, lineup builder, my-lineup, leaderboard
  /friends             # Friends list, search, invites
  /settings            # Notification preferences (email + push), username, account info
  /auth/callback       # Auth callback (email links, password reset)
  /auth/recovery       # Dedicated password recovery callback
  /api                 # API routes (device registration, push prefs, cron jobs)
    /register-device   # POST - iOS device token registration
    /unregister-device # POST - Remove device token
    /notification-preferences  # PUT - Update push preferences
    /cron/lock-reminder        # Cron: send reminders 3hrs before lock
    /cron/auto-lock            # Cron: lock expired contests
  /forgot-password     # Password reset flow
  /login, /signup      # Authentication pages (signup accepts invite_token)
  /unsubscribe/[token] # Token-based email preference management
  /privacy, /terms     # Legal pages (indexed)
  /credits             # TMDB attribution page
/components            # Reusable React components (mostly client)
  /admin               # Admin-specific components (contest form, movie management)
/actions               # Server actions ('use server') - 13 files
/lib                   # Utilities, Supabase clients, services - 13 modules
/public                # Static assets (logos, badges, icons)
/migrations            # SQL migration files for Supabase (001-011)
types.ts               # Centralized TypeScript definitions
middleware.ts          # Session refresh, security headers, CSP, rate limiting
next.config.js         # TMDB images, social media tracking redirects
sitemap.ts             # Dynamic sitemap (static pages + locked/resolved contests)
robots.ts              # Search engine rules (disallow /admin, /api, /auth)
vercel.json            # Cron job schedules
```

## Core Architecture

### Data Model (5 Core Objects)

1. **User** - Email authentication, past results tracking
2. **Contest** - Weekly slate, state transitions: `upcoming → locked → resolved`
3. **Movie** - Title, release date, distributor, theater count (optional), salary, projection, actual gross
4. **Lineup** - User's movie selections, state transitions: `editable → locked → scored`
5. **Entry** - Links user to contest with their lineup

### State Management

Contests and lineups flow through distinct states:
- **Contest states**: `upcoming` (accepting entries) → `locked` (Thursday 8PM ET) → `resolved` (after scoring Sunday night)
- **Lineup states**: `editable` (before lock) → `locked` (after Thursday 8PM ET) → `scored` (after actuals entered)

### Time Handling

All contest times stored in UTC, displayed in ET on frontend. Lock time: Thursday 8PM ET.

### Frontend Pages

**Public Pages:**
1. Landing page - Value proposition, CTA to current contest
2. Contest page - Rules, entry count, countdown to lock
3. Charts page - Weekly movie slate with projections, estimates, and actuals
4. Login/Signup - Authentication with email/password
5. Privacy/Terms - Legal pages
6. Forgot password - Password reset flow

**Authenticated Pages:**
7. Lineup builder - Real-time salary validation, prevent illegal lineups
8. My lineup - Read-only view after submission with perfect lineup badge
9. Leaderboard - Ranks and scores with friends filtering
10. Account - Past results, performance stats
11. Friends - Search users, send/manage invites, friends list
12. Settings - Email preferences, account settings

### Lineup Constraints

- 2-4 movies per lineup (optimal: 3 movies, ~30-40% of slate)
- $50,000 salary cap (salaries range 1-50,000)
- 1 entry per user per contest
- Instant salary validation required in builder (`lib/validation.ts`)
- Must prevent submission of illegal lineups

### Scoring Logic

```
for each lineup in contest:
    total_score = sum(movie.actual_gross for movie in lineup.movies)
    # $1M box office = 1 point
lineups.sort(by=total_score, descending=true)
assign ranks (handles ties)
```

Perfect lineup detection: `lib/perfect-lineup.ts` generates all valid combinations (2, 3, 4 movies within salary cap) and finds the maximum possible score. Users who achieve the perfect lineup get a badge.

### Salary System

Salaries derived from projected opening weekend gross. Admin sets salaries manually per movie (range: 1-50,000). Manual adjustments allowed.

### Weekend Estimate System (Preliminary Leaderboards)

Live scoring updates as box office estimates roll in during the weekend:

| Time | Estimate Field | Calculation |
|------|---------------|-------------|
| Saturday AM | `friday_estimate` | Friday gross only |
| Sunday AM | `saturday_estimate` | Friday + Saturday |
| Sunday PM | `sunday_estimate` | Full weekend estimate |
| Sunday night | `actual_gross` | Final Fri-Sun total |

Key files: `lib/estimate-utils.ts`, `actions/scoring.ts` (`getPreliminaryLeaderboard`)

- `calculateCurrentEstimate()` returns the best available score for a movie
- `getEstimateDirection()` returns uptick/downtick/neutral vs projection
- Preliminary leaderboard shows real-time rankings during locked contests
- Users see their estimated rank, score, and direction indicators on my-lineup page

### Data Sources (3 datasets + estimates)

1. **Movie Slate** - Title, release date, distributor, theater count (optional)
2. **Projections** - Single projected opening weekend gross per movie
3. **Daily Estimates** - Friday, Saturday, Sunday box office estimates (entered by admin)
4. **Actuals** - Final domestic opening weekend gross (Fri-Sun)

Note: Manual data entry acceptable until 100+ weekly users. Carryover movies (second weekend) are optional, copied via `copyMovieToContest()` with `prior_week_gross = source.actual_gross`.

### Charts Page

Public page showing weekly movie slate with:
- Movie posters (from TMDB API via `lib/tmdb-api.ts`, 24hr cache)
- Projections, Friday/Saturday estimates, final actuals
- Salary information
- Uptick/downtick indicators vs projections
- Estimate banners ("Friday estimates released!" etc.)

Related files: `app/charts/page.tsx`, `actions/charts.ts`, `components/chart-movie-row.tsx`, `lib/tmdb-api.ts`, `lib/tmdb.ts`

### Friends Feature

Users can add friends and filter leaderboards to compete with their social circle:
- **User search** - Find users by username (case-insensitive, debounced 300ms)
- **Friend requests** - Send/accept/reject/cancel (in-app)
- **Friend invites** - Send email invite to non-users (creates invite token, auto-accepts friendship on signup)
- **Friends list** - View and manage friends, unfriend
- **Leaderboard filtering** - Toggle between "All" and "Friends Only" views
- **DB helper**: `get_friend_ids()` SQL function for efficient friend lookups

Related files: `actions/friends.ts`, `actions/friend-invites.ts`, `components/user-search.tsx`, `components/friends-list.tsx`, `components/incoming-friend-requests.tsx`, `components/friend-invite-form.tsx`, `app/friends/`

### Analytics (Google Tag Manager)

GTM events tracked via `lib/gtm.ts`:
- `lineup_builder_opened`, `lineup_submitted`, `lineup_abandoned` (with stage: start/midway/near_end)
- `contest_viewed`, `leaderboard_viewed`
- `user_properties_set` (contest_sequence, user_cohort for GA4)

User properties: entry count and cohort (sequential contest number) set via `actions/account.ts`.

## Supabase Client Patterns

Two client types exist - use the correct one:

| Client | Location | Use Case |
|--------|----------|----------|
| `createClient()` | `lib/supabase-server.ts` | Default for all server operations. Subject to RLS. |
| `createAdminClient()` | `lib/supabase-admin.ts` | Admin operations that bypass RLS (scoring, leaderboards). |

**Rule**: Always use `createClient()` unless you specifically need to bypass Row Level Security. All database operations are server-side; no browser client is needed.

## Authorization Patterns

| Function | Location | Use Case |
|----------|----------|----------|
| `getUser()` | `lib/supabase-server.ts` | Get current user (returns null if not authenticated) |
| `requireAdmin()` | `lib/admin.ts` | Use in page components - redirects if not admin |
| `checkAdminAccess()` | `lib/admin.ts` | Use in server actions - throws error if not admin |
| `isAdmin()` | `lib/admin.ts` | Boolean check for conditional logic |

Admin users are stored in the `admin_users` table.

## Email System

Emails are sent via **Resend** with graceful degradation if not configured.

### Email Types
| Email | Trigger | File |
|-------|---------|------|
| New Contest | Admin publishes contest | `actions/emails.ts` |
| Lock Reminder | Cron job 3hrs before lock | `app/api/cron/lock-reminder/` |
| Results | Admin finalizes scoring | `actions/emails.ts` |
| Friend Invite | User sends invite | `actions/friend-invites.ts` |
| Password Reset | User requests reset | `actions/auth.ts` |

### Rate Limiting
- Auth action rate limiting: 5 attempts/minute per IP via Upstash Redis
- Page-level rate limiting: 30 requests/minute for auth routes (middleware)
- Email duplicate prevention tracked in `email_logs` table
- Push duplicate prevention tracked in `push_notification_logs` table
- Users can manage preferences in Settings page or via `/unsubscribe/[token]`

## Push Notifications

iOS push notifications via APNs, with graceful degradation if not configured.

### Architecture
- **APNs HTTP/2**: Direct integration using Node.js `http2` module (no external dependency)
- **JWT auth**: `.p8` key-based token authentication
- **Device tokens**: Stored in `device_tokens` table, registered via API routes
- **Dispatch**: Push sent alongside emails in the same 3 notification functions
- **Preferences**: Independent from email (3 email toggles + 3 push toggles)

### API Routes (for iOS app)
| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/register-device` | POST | JWT Bearer | Register APNs device token |
| `/api/unregister-device` | POST | JWT Bearer | Remove device token |
| `/api/notification-preferences` | PUT | JWT Bearer | Update push preferences |

API routes use JWT from `Authorization: Bearer <token>` header (not cookies).

### Key Files
| File | Purpose |
|------|---------|
| `lib/push.ts` | APNs service layer (HTTP/2 client, JWT signing) |
| `lib/push-dispatch.ts` | Send push to user's devices with dedup and logging |
| `lib/api-auth.ts` | JWT auth helper for API routes |
| `app/api/register-device/route.ts` | Device registration endpoint |
| `app/api/unregister-device/route.ts` | Device unregistration endpoint |
| `app/api/notification-preferences/route.ts` | Push preferences endpoint |

## Server Actions Reference

### Action Files (`/actions/`)

| File | Purpose | Access |
|------|---------|--------|
| `account.ts` | Entry count, cohort, past entries | Auth required |
| `admin-contests.ts` | List/delete contests | Admin only |
| `admin-movies.ts` | Update/delete/copy movies | Admin only |
| `auth.ts` | Sign in/up, password reset, sign out | Public (rate limited) |
| `charts.ts` | Public movie slate, TMDB data | Public |
| `contests.ts` | Create/get/lock/publish contests | Mixed (public reads, admin writes) |
| `emails.ts` | Notification dispatch, preference management | Mixed |
| `friend-invites.ts` | Email invites to non-users | Auth required |
| `friends.ts` | Search, request, accept, reject, unfriend | Auth required |
| `lineups.ts` | Submit/update lineups | Auth required |
| `movies.ts` | Create movies for contest | Admin only |
| `scoring.ts` | Score contest, leaderboards, estimates | Admin (score), Public (read) |
| `user-profiles.ts` | Username management | Auth required |

## Library Modules Reference

### Lib Files (`/lib/`)

| File | Exports | Purpose |
|------|---------|---------|
| `supabase-server.ts` | `createClient()`, `getUser()` | SSR Supabase client with cookies |
| `supabase-admin.ts` | `createAdminClient()` | Service role client (bypasses RLS) |
| `admin.ts` | `isAdmin()`, `requireAdmin()`, `checkAdminAccess()` | Admin authorization |
| `email.ts` | `send*Email()`, `isEmailConfigured()` | Resend email service |
| `push.ts` | `sendPushNotification()`, `isPushConfigured()` | APNs HTTP/2 with JWT signing |
| `push-dispatch.ts` | `sendPushToUser()` | Multi-device push with dedup |
| `api-auth.ts` | `createClientFromJWT()`, `getUserFromJWT()` | JWT auth for API routes |
| `validation.ts` | `validateLineup()`, `validateMoviesInContest()` | Lineup constraint validation |
| `estimate-utils.ts` | `calculateCurrentEstimate()`, `getEstimateDirection()` | Weekend estimate calculations |
| `perfect-lineup.ts` | `calculateMaxPossibleScore()` | Combinatorial optimal lineup detection |
| `tmdb-api.ts` | `getTMDBMovieInfo()`, `batchGetTMDBMovieInfo()` | TMDB movie details (24hr cache) |
| `tmdb.ts` | `getTMDBPosterUrl()`, `POSTER_SIZES` | TMDB poster URL construction |
| `gtm.ts` | Event tracking functions | Google Tag Manager / GA4 events |

## Code Conventions

- Use ES modules (import/export)
- Function components with React hooks only
- Prefer server components by default (use 'use client' only when needed)
- TypeScript required for all files
- All types defined in `types.ts` (centralized)
- Constants (`LINEUP_CONSTRAINTS`, `USERNAME_CONSTRAINTS`) defined in `types.ts` - import from there

### Component Patterns

- **Server components** (default): All `/app` page files. Call `getUser()` and server actions directly.
- **Client components**: Mark with `'use client'`. Use for interactivity (forms, state). Import and call server actions.
- **Header**: Server component that handles auth state - use as reference pattern.

### Server Actions (`/actions`)

All server action files start with `'use server'`. Follow this pattern:

1. **Validate input** - Check for null/undefined/empty values
2. **Verify authentication** - Call `getUser()`, redirect if needed
3. **Fetch and validate data** - Handle Supabase errors by code
4. **Business logic** - Apply rules and constraints
5. **Revalidate paths** - Call `revalidatePath()` for affected pages
6. **Redirect or return** - Redirect on success, throw on fatal error

**Error codes**: `PGRST116` = not found, `23505` = unique constraint violation

**Naming**: Domain-separated files. Admin actions in `admin-*.ts` files.

### Defensive Programming

Always validate data defensively:
```typescript
// Safe array handling (Supabase can return array or object)
const item = Array.isArray(data) ? data[0] : data;
const items = Array.isArray(data) ? data : [];
```

## SEO/AEO/GEO Guidelines

When adding new pages or content, include appropriate optimizations:

### For New Pages
- Add `generateMetadata` (dynamic) or `export const metadata` (static) with title, description, and canonical URL
- Use semantic HTML (`<main>`, `<section>`, `<article>`) with proper heading hierarchy (h1 > h2 > h3)
- Add to sitemap if publicly accessible (sitemap.ts auto-includes contest pages)

### Structured Data (JSON-LD)
Use components from `components/json-ld.tsx` when relevant:
- **BreadcrumbJsonLd** - For nested pages with navigation context
- **ContestEventJsonLd** - For contest/event pages
- **FAQJsonLd** - For pages with Q&A content

### When to Skip
- Admin pages (already excluded from sitemap/robots)
- Authenticated-only pages (use `robots: { index: false }`)
- Temporary or utility pages

### Key Target Keywords
Primary: "box office fantasy", "movie fantasy sports", "predict box office", "opening weekend predictions"

### Social Preview Images
Social preview images (og:image, twitter:image) are hosted on **Imgur** due to Twitter/X compatibility issues with Vercel CDN. When updating social images:
1. Upload to Imgur
2. Use direct link format: `https://i.imgur.com/XXXXXXX.png`
3. Update URLs in `app/layout.tsx` and page-specific metadata

### Social Media Tracking Redirects
Short URLs for tracking traffic sources (configured in `next.config.js`):
| URL | Platform | UTM Source |
|-----|----------|------------|
| `/x` | Twitter/X | twitter |
| `/ig` | Instagram | instagram |
| `/r` | Reddit | reddit |
| `/fb` | Facebook | facebook |
| `/tt` | TikTok | tiktok |
| `/li` | LinkedIn | linkedin |

All redirect to homepage with UTM parameters for Google Analytics tracking.

## Git Workflow

### Branching Strategy

- **Always work off a feature branch**, never directly on main/master
- At the start of each session, check if main has new commits and merge into the working branch if needed:
  ```bash
  git fetch origin
  git merge origin/master
  ```
- Only merge the feature branch back to main when the feature is complete and tested
- Delete the feature branch after it has been merged into main
- Use descriptive branch names (e.g., `feature/email-notifications`, `fix/scoring-bug`)

### Commits and Pushing

- Commit all new code changes with descriptive commit messages
- Do NOT push to remote until user has tested changes locally
- Start dev server (`npm run dev`) and wait for user approval before pushing

## Versioning

Use **Semantic Versioning** with git tags: `vMAJOR.MINOR.PATCH`

| Version | When to bump | Examples |
|---------|--------------|----------|
| **PATCH** (v1.0.x) | Bug fixes, small tweaks | Fix scoring bug, typo fixes, styling adjustments |
| **MINOR** (v1.x.0) | New features, backward-compatible | Email notifications, new pages, admin tools |
| **MAJOR** (vx.0.0) | Breaking changes, major redesigns | New scoring system, schema overhaul, complete UI redesign |

**When to create a tag** (proactively, without being asked):
- After shipping a notable new feature
- Before a contest weekend when multiple changes have been made
- Before making risky or experimental changes (as a rollback point)

**How to tag:**
```bash
git tag -a v1.0.1 -m "Brief description of changes"
git push origin v1.0.1
```

Current version: v1.2.0 (February 2026) - Added push notifications, iOS app API routes

## Database Schema

### Core Tables
| Table | Purpose | RLS |
|-------|---------|-----|
| `contests` | Weekly contest metadata (status, lock_time, published) | Public read, admin write |
| `movies` | Movie data (salary, projections, daily estimates, actuals) | Public read, admin write |
| `entries` | Links user to contest with lineup | User-scoped |
| `lineups` | User's movie selections, total_score, status | User-scoped |
| `lineup_movies` | Junction: lineup ↔ movie | User-scoped |
| `user_profiles` | Username, email/push preferences, unsubscribe_token | User-scoped |
| `admin_users` | Admin access control | User can check own status |

### Social Tables
| Table | Purpose | RLS |
|-------|---------|-----|
| `friendships` | Bidirectional friend relationships (user_a < user_b ordering) | Participants only |
| `friend_requests` | Pending/accepted/rejected requests | Sender + receiver |
| `friend_invites` | Email invites to non-users (with invite_token) | Inviter only |

### Notification Tables
| Table | Purpose | RLS |
|-------|---------|-----|
| `email_logs` | Sent email tracking + dedup | User read, service role write |
| `device_tokens` | APNs device registrations (multi-device per user) | User-scoped |
| `push_notification_logs` | Push tracking + dedup (unique per user+contest+type) | User read, service role write |

### Design Theme
Dark theme with teal accent:
- Background: `#0f0f1a` (dark-bg), `#1a1a2e` (dark-surface), `#252540` (dark-elevated)
- Borders: `#2d2d4a` (dark-border)
- Accent: `#4fd1c5` (teal), `#81e6d9` (light), `#38b2ac` (dark)

## Cron Jobs (vercel.json)

| Schedule | Route | Purpose |
|----------|-------|---------|
| `0 22 * * 4` (Thu 5PM ET) | `/api/cron/lock-reminder` | Send lock reminders (email + push) 3hrs before lock |
| `0 1 * * 5` (Thu 8PM ET) | `/api/cron/auto-lock` | Lock expired contests, lock all lineups |

Both cron routes require `CRON_SECRET` authorization header. Auto-lock runs once daily to stay within Vercel Hobby plan limits.

## Weekly Operations Workflow

- **Monday-Tuesday**: Enter movie slate, projections, set salaries (admin)
- **Wednesday**: QA contest, publish contest (requires 6+ movies), send "New Contest" emails + push
- **Thursday 5PM ET**: Lock reminder sent automatically via cron (email + push)
- **Thursday 8PM ET**: Contest locks automatically via cron, all lineups locked
- **Friday-Sunday**: Enter daily estimates as they become available (Friday, Saturday, Sunday). Preliminary leaderboard updates automatically.
- **Sunday night**: Enter actuals, run scoring, publish leaderboard, send results emails + push

### Admin Contest Workflow
1. Create contest → status: `upcoming`, published: `false`
2. Add movies (min 6) with salaries and projections
3. Publish contest → sends "New Contest" notification
4. Contest auto-locks at lock time → lineups become read-only
5. Enter daily estimates (Fri/Sat/Sun) → preliminary leaderboard active
6. Enter actuals → run scoring → contest `resolved`, lineups `scored`
7. Send results notification

## Environment Variables

```
SUPABASE_URL=https://...                  # Server-only - Supabase project URL
SUPABASE_ANON_KEY=...                     # Server-only - Anonymous key (RLS enforced)
SUPABASE_SERVICE_ROLE_KEY=...             # Server-only - Bypasses RLS (admin operations)
UPSTASH_REDIS_REST_URL=...                # Optional - Rate limiting (graceful degradation if missing)
UPSTASH_REDIS_REST_TOKEN=...              # Optional - Rate limiting token
RESEND_API_KEY=...                        # Optional - Email service (graceful degradation if missing)
EMAIL_FROM=Shugsy <noreply@shugsy.com>    # Optional - Email sender address
NEXT_PUBLIC_APP_URL=https://www.shugsy.com # Required for email links (use www)
CRON_SECRET=...                           # Optional - Vercel Cron authorization
TMDB_API_KEY=...                          # Optional - Movie posters on charts page
APNS_KEY_ID=...                           # Optional - APNs auth key ID
APNS_TEAM_ID=...                          # Optional - Apple Developer Team ID
APNS_SIGNING_KEY=...                      # Optional - Base64-encoded .p8 key (Vercel)
APNS_KEY_PATH=...                         # Optional - Path to .p8 file (local dev)
APNS_BUNDLE_ID=...                        # Optional - iOS app bundle ID
```

All variables are server-only (no `NEXT_PUBLIC_` prefix) except `NEXT_PUBLIC_APP_URL`. This prevents API keys from being exposed in the client JavaScript bundle.

## Security

### Middleware (`middleware.ts`)
- **CSP**: Nonce-based script execution, strict directives (allows GTM, GA, Supabase, TMDB)
- **Headers**: X-Frame-Options DENY, HSTS (1yr + preload), nosniff, strict referrer policy
- **Permissions**: Blocks camera, microphone, geolocation, payment
- **Session**: Auto-refreshes Supabase auth session on every request
- **Password reset**: Forces redirect to `/account/reset-password` if pending reset (via cookie + user metadata)

### Auth Validation (`actions/auth.ts`)
- Password: 8+ chars, 1 uppercase, 1 lowercase, 1 number
- Username: 3-20 chars, alphanumeric + underscore (case-insensitive uniqueness)
- Rate limit: 5 auth attempts per minute per IP