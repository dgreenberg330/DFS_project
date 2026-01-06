# Testing the Lineup Builder

## Quick Start

### 1. Sign In
```
http://localhost:3000/login
```
Enter your email and click the magic link.

### 2. Create a Test Contest
```
http://localhost:3000/admin/create-contest
```
Click "Create Test Contest" - this creates a contest with 7 sample movies.

### 3. Build Your Lineup
After creating the contest, click "Build Lineup" or visit:
```
http://localhost:3000/contests/[contest-id]/lineup
```

## What to Test

### ✅ Movie Selection
- [ ] Click movies to select/deselect
- [ ] Selected movies show blue background with checkmark
- [ ] Can select 2-4 movies
- [ ] Cannot select more than 4 (button disabled + error message)

### ✅ Real-Time Validation
- [ ] Movie count updates (e.g., "3/4 Movies")
- [ ] Remaining salary updates as you select/deselect
- [ ] Remaining salary turns red if negative
- [ ] Projected total updates with each selection

### ✅ Salary Cap Enforcement
- [ ] Try selecting expensive movies to exceed $100
- [ ] "Remaining" shows negative amount in red
- [ ] Submit button disabled when over cap
- [ ] Validation hint shows "Salary cap exceeded by $X"

### ✅ Lineup Constraints
- [ ] Can't submit with 0-1 movies (button disabled)
- [ ] Can submit with 2 movies
- [ ] Can submit with 3 movies (optimal)
- [ ] Can submit with 4 movies
- [ ] Shows "✓ Valid lineup" when requirements met

### ✅ Submission Flow
- [ ] Click "Submit Lineup"
- [ ] Button shows "Submitting..." while processing
- [ ] Success message: "Locked. Good luck."
- [ ] Can edit lineup after submission (updates existing)
- [ ] Button changes to "Update Lineup" for existing entries

### ✅ Mobile Responsiveness
- [ ] Resize browser to mobile width (375px)
- [ ] Movie list is readable and clickable
- [ ] Summary cards stack properly
- [ ] Submit button spans full width
- [ ] No horizontal scrolling

### ✅ Contest Lock State
- [ ] Create locked contest (manually update status in database)
- [ ] Visit lineup page
- [ ] Shows "Contest is locked" message
- [ ] Cannot select/deselect movies
- [ ] No submit button

## Sample Test Scenarios

### Scenario 1: Optimal Lineup (3 movies, under cap)
Select:
1. Big Budget Blockbuster ($48)
2. Family Comedy ($32)
3. Horror Thriller ($18)

**Expected:**
- Total: $98 (under $100 ✓)
- Remaining: $2
- Movies: 3/4
- Projected: ~63.7 pts
- Submit enabled ✓

### Scenario 2: Exceed Salary Cap
Select:
1. Big Budget Blockbuster ($48)
2. Action Sequel ($40)
3. Carryover Hit ($35)

**Expected:**
- Total: $123 (over $100 ✗)
- Remaining: -$23 (red)
- Submit disabled ✗
- Error: "Salary cap exceeded by $23"

### Scenario 3: Too Few Movies
Select:
1. Big Budget Blockbuster ($48)

**Expected:**
- Movies: 1/4
- Submit disabled ✗
- Hint: "Select at least 2 movies"

### Scenario 4: Maximum Movies
Select:
1. Limited Release Drama ($8)
2. Horror Thriller ($18)
3. Romantic Drama ($24)
4. Family Comedy ($32)

**Expected:**
- Total: $82 (under $100 ✓)
- Remaining: $18
- Movies: 4/4
- 5th movie click disabled
- Submit enabled ✓

### Scenario 5: Edit Existing Lineup
1. Submit a lineup
2. See "Locked. Good luck." message
3. Change selections
4. Click "Update Lineup"
5. Success message appears again

## URL Structure

```
/                              - Home page
/login                         - Sign in with magic link
/account                       - View past entries
/admin/create-contest          - Create test contest
/contests/[id]/lineup          - Build lineup for contest
```

## Database Queries (for debugging)

Check contest:
```sql
SELECT * FROM contests ORDER BY created_at DESC LIMIT 1;
```

Check movies:
```sql
SELECT title, salary, projected_gross FROM movies
WHERE contest_id = 'your-contest-id'
ORDER BY salary DESC;
```

Check entries:
```sql
SELECT e.*, l.status, l.total_score
FROM entries e
JOIN lineups l ON e.lineup_id = l.id
WHERE contest_id = 'your-contest-id';
```

Check lineup movies:
```sql
SELECT m.title, m.salary
FROM lineup_movies lm
JOIN movies m ON lm.movie_id = m.id
WHERE lm.lineup_id = 'your-lineup-id';
```

## Common Issues

**Movies not showing:**
- Check database has movies for the contest
- Run query: `SELECT COUNT(*) FROM movies WHERE contest_id = ?`

**Submit button always disabled:**
- Check browser console for errors
- Verify validation logic (should allow 2-4 movies, ≤$100)

**"Contest is locked" immediately:**
- Check contest status: `SELECT status FROM contests WHERE id = ?`
- Should be 'upcoming' not 'locked'

**Existing lineup not loading:**
- Check if entry exists: `SELECT * FROM entries WHERE user_id = ? AND contest_id = ?`
- Check lineup_movies join table

**Projected score not updating:**
- Check projected_gross values in movies table
- Should be numeric (not null)

## Next Features to Test

After lineup builder works:
1. Leaderboard page (view results)
2. Contest page (rules, countdown)
3. Past results on account page
4. Scoring script (admin function)
