\# MVP

\- Opening weekend box office wide release. One slate per week, all wide releases opening that weekend. Can include carryovers (second weekend, movies opening in last 14 days, etc). Carryover movies are optional and must be explicitly added to the slate by the admin; no automatic inclusion.

&nbsp;	- Minimum slate 6 movies.

&nbsp;	- Lineup: 2-4 movies (optimal = 30-40% of slate, 1/3). 3 movies ideal

&nbsp;		- Salary cap: $100

&nbsp;		- Entry limit: 1 lineup per user

&nbsp;	- Lineup locks thursday 8PM ET, finalize sunday night. All contest times are stored in UTC and displayed in ET on the frontend.

&nbsp;	- Scoring

&nbsp;		- Total domestic opening weekend gross

&nbsp;		- $1M box office = 1 point

&nbsp;		- Final score = sum of selected movies

&nbsp;	- Free to play, leaderboard

&nbsp;	- Login: email only. Authentication via email magic link using Supabase Auth; no passwords.



\# Data: 3 datasets

\- 1: Movie slate

&nbsp;	- Title, release date, distributor, theater count (optional)

\- 2: Projections

&nbsp;	- Single projected opening weekend gross per movie 

\- 3: Actuals

&nbsp;	- First domestic opening weekend gross (Fri-Sun)

\- Manually input data at first, run a simple scoring script or spreadsheet. Manual is fine until 100+ weekly users

\- Analyze scoring and salary simulations in excel



\# Front end: 6 pages, simple web app (Next.js / React). 

\- Use Figma to sketch lineup builder, leaderboard, and ensure mobile responsiveness. One page per screen, no design systems

\- 1: Landing page

&nbsp;	- What it is, how it works, "Play this week's contest"

\- 2: Contest page

&nbsp;	- Rules, entry count, countdown to lock

\- 3: Lineup builder

&nbsp;	- Movie list with salaries, remaining salary, submit button

&nbsp;	- Salary updates instantly, prevent illegal lineups, show projected total when building

&nbsp;	- Confirm submission clearly ("Locked. Good luck.")

\- 4: My lineup

&nbsp;	- Locked view after submission

&nbsp;	- Shows chosen movies + salaries

\- 5: Leaderboard

&nbsp;	- Ranks, scores (live or final), highlight top lineups. Leaderboard updates only after final scoring (no live updates in MVP).

\- 6: Account

&nbsp;	- Email login, past results



\# Backend: contest logic, lineup storage, scoring script (supabase)

\- Core objects: user, contest, movie, lineup, entry

\- Core states

&nbsp;	- Contest: upcoming -> locked -> resolved

&nbsp;	- Lineup: editable -> locked -> scored

\- Scoring logic: loop through lineups, sum movie grosses, sort descending, assign rank

\- Vercel deploy



\# Ops (manual)

\- Monday-Tuesday: Identify upcoming wide releases, enter movie slate + projections, set salaries. Salaries are derived from projected opening weekend gross using a linear scale where the highest projection costs $45–50 (or more) and the lowest costs $5–8 (or less), adjusted manually if needed.

\- Wednesday: QA contest, email reminder to users

\- Thursday: lock contest, sanity check entries

\- Sunday night: enter final grosses, run scoring, publish leaderboard, email winners



\# Tech Stack

\- Framework: Next.js 14 with App Router

\- Language: TypeScript

\- Database: Supabase (PostgreSQL)

\- Styling: Tailwind CSS

\- Deployment: Vercel



\# Commands

\- `npm run dev`: Start development server

\- `npm run build`: Production build

\- `supabase start`: Local database

\- `npm run test`: Run tests



\# Code Style

\- Use TypeScript for all files

\- Use ES modules (import/export)

\- Function components with hooks only

\- Prefer server components by default

