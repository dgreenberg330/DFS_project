# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a box office fantasy sports game where users create lineups of movies to compete based on opening weekend box office performance. Users select 2-4 movies from a weekly slate (minimum 6 movies) within a $100 salary cap, scoring 1 point per $1M in domestic opening weekend gross.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (required for all files)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email magic links (no passwords)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run test` - Run tests
- `supabase start` - Local database

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

### Frontend Pages (6 total)

1. Landing page - Value proposition, CTA to current contest
2. Contest page - Rules, entry count, countdown to lock
3. Lineup builder - Real-time salary validation, prevent illegal lineups, show projected total
4. My lineup - Read-only view after submission
5. Leaderboard - Ranks and scores (updates only after final scoring, no live updates in MVP)
6. Account - Login, past results

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

## Code Conventions

- Use ES modules (import/export)
- Function components with React hooks only
- Prefer server components by default (use 'use client' only when needed)
- TypeScript required for all files

## Weekly Operations Workflow

- **Monday-Tuesday**: Enter movie slate, projections, set salaries
- **Wednesday**: QA contest, send email reminder
- **Thursday**: Contest locks at 8PM ET, verify entries
- **Sunday night**: Enter actuals, run scoring, publish leaderboard, email winners