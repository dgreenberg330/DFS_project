# Backend Usage Examples

This document demonstrates how to use the server actions for the box office fantasy sports game.

## Weekly Operations Workflow

### Monday-Tuesday: Setup Contest and Movies

```typescript
import { createContest } from '@/actions/contests';
import { batchCreateMovies } from '@/actions/movies';

// 1. Create new contest for upcoming weekend
const contest = await createContest({
  name: "Weekend of Jan 10-12, 2025",
  lock_time: "2025-01-10T01:00:00Z", // Thursday 8PM ET = Friday 1AM UTC
  weekend_start: "2025-01-10",
  weekend_end: "2025-01-12"
});

// 2. Add movies to contest with salaries and projections
// Salaries derived from projections using linear scale:
// - Highest projection: $45-50
// - Lowest projection: $5-8
await batchCreateMovies([
  {
    contest_id: contest.id,
    title: "Big Blockbuster",
    release_date: "2025-01-10",
    distributor: "Major Studio",
    theater_count: 4200,
    salary: 48, // High projection
    projected_gross: 35.0 // $35M
  },
  {
    contest_id: contest.id,
    title: "Mid-Range Comedy",
    release_date: "2025-01-10",
    distributor: "Indie Studio",
    theater_count: 2800,
    salary: 28,
    projected_gross: 18.5 // $18.5M
  },
  {
    contest_id: contest.id,
    title: "Limited Release Drama",
    release_date: "2025-01-10",
    theater_count: 1200,
    salary: 12,
    projected_gross: 6.2 // $6.2M
  },
  {
    contest_id: contest.id,
    title: "Carryover Hit", // Second weekend movie
    release_date: "2025-01-03", // Released previous weekend
    distributor: "Major Studio",
    theater_count: 3900,
    salary: 35,
    projected_gross: 22.0 // $22M (second weekend)
  },
  // Add more movies (minimum 6 total per spec)
  // ...
]);
```

### Wednesday: QA and Reminders

```typescript
import { getCurrentContest, getContest } from '@/actions/contests';

// Get active contest for QA
const contest = await getCurrentContest();
const contestWithMovies = await getContest(contest.id);

// Verify:
// - At least 6 movies in slate
// - Salaries span $5-50 range
// - lock_time is correct (Thursday 8PM ET in UTC)
console.log(`Movies: ${contestWithMovies.movies.length}`);
console.log(`Lock time: ${contestWithMovies.lock_time}`);

// Send reminder emails (separate email function not shown)
```

### Thursday Evening: Lock Contest

```typescript
import { lockExpiredContests, lockContest } from '@/actions/contests';

// Option 1: Auto-lock all contests past lock_time
const lockedContestIds = await lockExpiredContests();
console.log(`Locked ${lockedContestIds.length} contest(s)`);

// Option 2: Manually lock specific contest
await lockContest(contestId);

// After locking:
// - Contest status: upcoming -> locked
// - All lineups status: editable -> locked
// - No more submissions or edits allowed
```

### Sunday Night: Enter Actuals and Score

```typescript
import { batchUpdateActuals, scoreContest, getLeaderboard } from '@/actions/scoring';

// 1. Update actual opening weekend grosses (Fri-Sun)
await batchUpdateActuals([
  { movieId: "movie1-uuid", actualGross: 32.8 }, // $32.8M
  { movieId: "movie2-uuid", actualGross: 19.1 }, // $19.1M
  { movieId: "movie3-uuid", actualGross: 7.5 },  // $7.5M
  { movieId: "movie4-uuid", actualGross: 18.3 }, // $18.3M
  // ... all movies in contest
]);

// 2. Run scoring
const leaderboard = await scoreContest(contestId);

// Returns sorted array:
// [
//   { user_id, entry_id, lineup_id, total_score: 59.4, rank: 1 },
//   { user_id, entry_id, lineup_id, total_score: 52.1, rank: 2 },
//   ...
// ]

// 3. Get full leaderboard with user info
const fullLeaderboard = await getLeaderboard(contestId);

// fullLeaderboard includes:
// - User email
// - Lineup with all movie details
// - Total score and rank

// 4. Send winner emails (separate email function not shown)
```

## User Actions

### Submit Lineup

```typescript
import { submitLineup } from '@/actions/lineups';
import { calculateProjectedScore } from '@/actions/lineups';

// User selects 2-4 movies
const movieIds = ["movie1-uuid", "movie2-uuid", "movie3-uuid"];

// Calculate projected score (optional, for UI display)
const projectedScore = await calculateProjectedScore(movieIds);
console.log(`Projected: ${projectedScore.toFixed(1)} points`);

// Submit lineup
try {
  const entry = await submitLineup({
    contest_id: "contest-uuid",
    movie_ids: movieIds
  });

  console.log("Lineup submitted successfully!");
} catch (error) {
  // Validation errors:
  // - "Must select between 2 and 4 movies"
  // - "Total salary $105 exceeds cap of $100"
  // - "Contest is locked. Cannot submit or edit lineup."
  // - "You already have an entry for this contest"
  console.error(error.message);
}
```

### Edit Lineup (Before Lock)

```typescript
// If user already has entry, submitLineup() updates it
// Same function handles both create and update

const updatedEntry = await submitLineup({
  contest_id: "contest-uuid",
  movie_ids: ["different-movie1", "different-movie2", "movie3-uuid"]
});

// Will fail if contest is locked
```

### View My Lineup

```typescript
import { getUserEntry } from '@/actions/lineups';

const entry = await getUserEntry(contestId);

if (!entry) {
  console.log("No entry for this contest");
} else {
  console.log("Your lineup:");
  entry.lineup.movies.forEach(movie => {
    console.log(`- ${movie.title} ($${movie.salary})`);
  });

  if (entry.lineup.status === 'scored') {
    console.log(`Final score: ${entry.lineup.total_score}`);
  }
}
```

### View Leaderboard

```typescript
import { getLeaderboard } from '@/actions/scoring';

// Only works for resolved contests
const leaderboard = await getLeaderboard(contestId);

leaderboard.forEach((entry, index) => {
  console.log(`#${entry.rank} - ${entry.user.email} - ${entry.lineup.total_score} pts`);
});
```

## Validation Examples

### Lineup Validation

```typescript
import { validateLineup } from '@/lib/validation';

// Example: Too many movies
const validation = validateLineup([movie1, movie2, movie3, movie4, movie5]);
// { isValid: false, errors: ["Cannot select more than 4 movies"], ... }

// Example: Salary cap exceeded
const validation = validateLineup([expensive1, expensive2, expensive3]);
// { isValid: false, errors: ["Total salary $105 exceeds cap of $100"], ... }

// Example: Valid lineup
const validation = validateLineup([movie1, movie2, movie3]);
// { isValid: true, errors: [], movieCount: 3, totalSalary: 85, remainingSalary: 15 }
```

## State Transitions

### Contest States

```
upcoming -> locked -> resolved
   ^          ^          ^
   |          |          |
   |          |          +-- scoreContest()
   |          |
   |          +-- lockExpiredContests() or lockContest()
   |
   +-- createContest()
```

### Lineup States

```
editable -> locked -> scored
   ^         ^         ^
   |         |         |
   |         |         +-- scoreContest()
   |         |
   |         +-- lockExpiredContests() (when contest locks)
   |
   +-- submitLineup()
```

## Error Handling

All server actions throw errors with descriptive messages:

```typescript
try {
  await submitLineup({ contest_id, movie_ids });
} catch (error) {
  if (error.message.includes('locked')) {
    // Show "Contest has ended" message
  } else if (error.message.includes('salary')) {
    // Show salary validation error
  } else if (error.message.includes('Unauthorized')) {
    // Redirect to login
  } else {
    // Generic error
  }
}
```

## Notes

1. **Authentication**: All user actions require authentication via `getAuthenticatedUser()`. Ensure Supabase Auth is configured.

2. **No Cron Jobs**: Manual execution required for:
   - `lockExpiredContests()` - Run Thursday ~8PM ET
   - `scoreContest()` - Run Sunday night after entering actuals

3. **Time Zones**: Always pass `lock_time` as ISO 8601 UTC timestamp. Frontend handles ET conversion.

4. **Revalidation**: Server actions call `revalidatePath()` to invalidate Next.js cache. Ensure ISR/SSR pages are configured properly.

5. **Database Permissions**: Uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS. Implement permission checks in server actions as needed.

6. **Batch Operations**: Use `batchCreateMovies()` and `batchUpdateActuals()` for efficiency when working with multiple records.