# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a box office fantasy sports game where users create lineups of movies to compete based on opening weekend box office performance. Users select 2-4 movies from a weekly slate (minimum 6 movies) within a $100 salary cap, scoring 1 point per $1M in domestic opening weekend gross.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (required for all files)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email/password (password required)
- **Styling**: Tailwind CSS
- **Rate Limiting**: Upstash Redis (optional, graceful degradation)
- **Deployment**: Vercel

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Production build (use this to verify changes compile)
- `supabase start` - Local database

## Project Structure

```
/app                    # Next.js App Router (pages and layouts)
  /admin               # Protected admin routes
  /account             # User account and past results
  /charts              # Box office charts with projections
  /contests/[id]       # Dynamic contest pages (lineup builder, leaderboard)
  /friends             # Friends list, search, invites
  /settings            # User settings and email preferences
  /auth/callback       # OAuth callback handler
  /forgot-password     # Password reset flow
  /login, /signup      # Authentication pages
  /privacy, /terms     # Legal pages
  /credits             # Attribution page
/components            # Reusable React components (mostly client)
  /admin               # Admin-specific components
/actions               # Server actions ('use server')
/lib                   # Utilities, Supabase clients, email service
/public                # Static assets (logos, badges, icons)
/migrations            # SQL migration files for Supabase
types.ts               # Centralized TypeScript definitions
middleware.ts          # Session refresh, security headers, CSP
next.config.js         # Social media tracking redirects
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
- $100 salary cap
- 1 entry per user per contest
- Instant salary validation required in builder
- Must prevent submission of illegal lineups

### Scoring Logic

```
for each lineup in contest:
    total_score = sum(movie.actual_gross for movie in lineup.movies)
    # $1M box office = 1 point
lineups.sort(by=total_score, descending=true)
assign ranks
```

### Salary System

Salaries derived from projected opening weekend gross using linear scale:
- Highest projection: $45-50 (or more)
- Lowest projection: $5-8 (or less)
- Manual adjustments allowed

### Data Sources (3 datasets)

1. **Movie Slate** - Title, release date, distributor, theater count (optional)
2. **Projections** - Single projected opening weekend gross per movie
3. **Actuals** - Final domestic opening weekend gross (Fri-Sun)

Note: Manual data entry acceptable until 100+ weekly users. Carryover movies (second weekend, released in last 14 days) are optional and must be explicitly added by admin.

### Charts Page

Public page showing weekly movie slate with:
- Movie posters (from TMDB API)
- Projections, Friday/Saturday estimates, final actuals
- Salary information
- Theater counts

Related files: `app/charts/page.tsx`, `actions/charts.ts`, `components/chart-movie-row.tsx`, `lib/tmdb-api.ts`

### Friends Feature

Users can add friends and filter leaderboards to compete with their social circle:
- **User search** - Find users by username (case-insensitive)
- **Friend invites** - Send/accept/decline friend requests
- **Friends list** - View and manage friends
- **Leaderboard filtering** - Toggle between "All" and "Friends Only" views

Related files: `actions/friends.ts`, `actions/friend-invites.ts`, `components/friends-*.tsx`, `app/friends/`

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
- Email rate limiting via Upstash Redis
- Duplicate prevention tracked in `sent_emails` table
- Users can manage preferences in Settings page

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

Current version: v1.1.0 (February 2025) - Added friends feature, charts page, social tracking

## Weekly Operations Workflow

- **Monday-Tuesday**: Enter movie slate, projections, set salaries
- **Wednesday**: QA contest, publish contest, send "New Contest" announcement emails
- **Thursday**: Lock reminder sent automatically via cron at 5PM ET (3 hours before lock). Contest locks at 8PM ET.
- **Sunday night**: Enter actuals, run scoring, publish leaderboard, send results emails

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
```

All variables are server-only (no `NEXT_PUBLIC_` prefix) except `NEXT_PUBLIC_APP_URL`. This prevents API keys from being exposed in the client JavaScript bundle.