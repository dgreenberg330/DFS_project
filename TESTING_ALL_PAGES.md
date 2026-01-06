# Testing All Pages - Complete Flow

## Page URLs

```
/                                    - Landing page
/contests/[id]                       - Contest page
/contests/[id]/lineup                - Lineup builder
/contests/[id]/my-lineup             - My lineup (locked view)
/contests/[id]/leaderboard           - Leaderboard (final scores)
/account                             - Account page
/login                               - Login page
/admin                               - Admin dashboard
/admin/contests/new                  - Admin: create contest
/admin/contests/[id]/movies          - Admin: manage movies
/admin/contests/[id]/actuals         - Admin: enter actuals
/admin/contests/[id]/score           - Admin: score contest
```

## Complete User Flow Test

### 1. Landing Page (/)

**What to check:**
- [ ] Header shows "Sign In" if not logged in
- [ ] Header shows "Account" if logged in
- [ ] CTA button: "Play This Week's Contest" (if contest exists)
- [ ] Lock time displayed in ET timezone
- [ ] "How It Works" section (3 steps)
- [ ] "Contest Rules" section (7 rules)

### 2. Create Contest (Admin)

**Steps:**
1. Sign in at `/login`
2. Visit `/admin`
3. Click "Create New Contest"
4. Select Friday date for opening weekend
5. Click "Create Contest"
6. Add movies via form, historical selection, or CSV upload

### 3. Contest Page (/contests/[id])

**What to check:**
- [ ] Contest name and dates displayed
- [ ] Status: "Contest Open" or "Contest Locked"
- [ ] Lock time in ET timezone
- [ ] Entry count displayed
- [ ] "Build Lineup" button (if not entered and not locked)
- [ ] "View My Lineup" + "Edit Lineup" buttons (if entered)
- [ ] "You're entered" green banner (if has entry)
- [ ] "Sign in to enter" blue banner (if not logged in)
- [ ] Contest rules section
- [ ] Movie list preview (first 5 movies)

### 4. Lineup Builder (/contests/[id]/lineup)

**What to check:**
- [ ] Movie list with salaries
- [ ] Checkbox selection
- [ ] Real-time movie count (e.g., "3/4 Movies")
- [ ] Real-time remaining salary
- [ ] Real-time projected score
- [ ] Cannot select more than 4 movies
- [ ] Salary cap validation (red if over $100)
- [ ] Submit button disabled when invalid
- [ ] "Locked. Good luck." message after submit
- [ ] Can edit and resubmit
- [ ] "Contest is locked" message if locked
- [ ] Existing lineup pre-selected if user has entry

### 5. My Lineup Page (/contests/[id]/my-lineup)

**What to check:**
- [ ] Redirects to `/lineup` if no entry
- [ ] Status banner: "Lineup Submitted" (green) or "Lineup Locked" (yellow) or "Final Results" (blue)
- [ ] Summary: movies count, total salary, projected/final points
- [ ] All selected movies listed
- [ ] Movie details: title, date, distributor, theaters
- [ ] Salary displayed for each movie
- [ ] Projected gross shown (before scoring)
- [ ] Actual gross + points shown (after scoring)
- [ ] "Edit Lineup" button (if not locked)
- [ ] "View Leaderboard" button (if scored)
- [ ] Total calculated correctly

### 6. Leaderboard Page (/contests/[id]/leaderboard)

**What to check:**
- [ ] Only shows for resolved contests
- [ ] "Not Available Yet" message for upcoming/locked contests
- [ ] Contest info: total entries, winning score, your rank
- [ ] Rankings sorted by score (highest first)
- [ ] Rank displayed (#1, #2, #3, etc.)
- [ ] Top 3 have yellow background
- [ ] User's entry has blue background + "Your Entry" badge
- [ ] Each entry shows: rank, user, movies, total score
- [ ] Movies show actual gross in millions
- [ ] Total points displayed prominently
- [ ] Handles ties correctly (same score = same rank)

### 7. Account Page (/account)

**What to check:**
- [ ] User email displayed
- [ ] "Sign Out" button works
- [ ] Past contests listed (newest first)
- [ ] Each contest shows: name, dates, status
- [ ] Movies in lineup displayed
- [ ] Total salary shown
- [ ] Final score + rank (if scored)
- [ ] "Awaiting results" (if locked but not scored)
- [ ] Stats summary: total contests, completed, wins
- [ ] No past contests message (if new user)

## State-Specific Tests

### Test 1: Upcoming Contest
**Contest status:** `upcoming`
**Lineup status:** `editable`

- Contest page: "Contest Open" + "Build Lineup" button
- Lineup builder: All features work
- My Lineup: "Lineup Submitted" (green), can edit
- Leaderboard: "Not Available Yet"

### Test 2: Locked Contest
**Contest status:** `locked`
**Lineup status:** `locked`

- Contest page: "Contest Locked" banner
- Lineup builder: "Contest is locked" message, no editing
- My Lineup: "Lineup Locked. Good luck!" (yellow), no edit button
- Leaderboard: "Not Available Yet" (locked status)

### Test 3: Resolved Contest
**Contest status:** `resolved`
**Lineup status:** `scored`

- Contest page: "View Leaderboard" link appears
- Lineup builder: Still locked
- My Lineup: "Final Results" (blue), shows actual gross + points
- Leaderboard: Full rankings displayed

## Mobile Test

Resize browser to 375px width:

- [ ] Landing page responsive
- [ ] Contest page readable
- [ ] Lineup builder works on mobile
- [ ] My lineup shows all info
- [ ] Leaderboard readable
- [ ] Account page displays correctly
- [ ] No horizontal scrolling on any page

## Navigation Test

From Landing Page:
- [ ] "Play This Week's Contest" → Contest page
- [ ] "Sign In" → Login page
- [ ] "Account" → Account page (if logged in)

From Contest Page:
- [ ] "Build Lineup" → Lineup builder
- [ ] "View My Lineup" → My lineup page
- [ ] "View Leaderboard" → Leaderboard (if resolved)
- [ ] "Back to Home" → Landing page

From Lineup Builder:
- [ ] "Account" link → Account page
- [ ] "Home" link → Landing page

From My Lineup:
- [ ] "Edit Lineup" → Lineup builder
- [ ] "View Leaderboard" → Leaderboard
- [ ] "View All My Entries" → Account page
- [ ] "Back to Contest" → Contest page

From Leaderboard:
- [ ] "Back to Home" → Landing page
- [ ] "View All My Entries" → Account page (if logged in)
- [ ] "Back to Contest" → Contest page

## Complete Flow: New User

1. Visit `/` → See landing page with rules
2. Click "Sign In" → Login page
3. Enter email → Magic link sent
4. Click magic link → Redirected to `/account`
5. Visit `/` or create contest
6. Visit `/contests/[id]` → Contest page
7. Click "Build Lineup" → Lineup builder
8. Select 3 movies → Submit
9. See "Locked. Good luck." → Success
10. Visit `/contests/[id]/my-lineup` → See locked view
11. Visit `/account` → See entry in past contests

## Admin Flow: Create and Score Contest

1. Visit `/admin`
2. Create new contest at `/admin/contests/new`
3. Add movies at `/admin/contests/[id]/movies`
4. Submit lineup as user
4. Manually update contest status to 'locked' in database
5. Visit lineup → See "Contest is locked"
6. Manually add actual_gross to all movies in database
7. Run scoring script (via API or admin page)
8. Visit `/contests/[id]/leaderboard` → See final rankings

## Database Queries for Testing

```sql
-- View contest status
SELECT id, name, status, lock_time FROM contests ORDER BY created_at DESC LIMIT 5;

-- View entries for contest
SELECT e.id, u.email, l.status, l.total_score
FROM entries e
JOIN auth.users u ON e.user_id = u.id
JOIN lineups l ON e.lineup_id = l.id
WHERE e.contest_id = 'your-contest-id';

-- Manually lock contest
UPDATE contests SET status = 'locked' WHERE id = 'your-contest-id';

-- Manually add actuals (for testing scoring)
UPDATE movies SET actual_gross = 32.5 WHERE id = 'movie1-id';
UPDATE movies SET actual_gross = 18.2 WHERE id = 'movie2-id';
-- ... etc

-- Manually score (call action or run SQL)
-- See scoring.ts for scoreContest() logic
```

## Success Criteria

All pages should:
- ✅ Load without errors
- ✅ Display correct data based on state
- ✅ Handle unauthenticated users gracefully
- ✅ Show appropriate CTAs based on context
- ✅ Respect contest and lineup states
- ✅ Navigate correctly between pages
- ✅ Display responsive on mobile
- ✅ Show accurate calculations
- ✅ Handle edge cases (no entries, no contest, etc.)
