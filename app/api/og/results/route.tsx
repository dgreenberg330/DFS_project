// ============================================================================
// OG Image: Share Results Card
// Generates a dynamic social preview image for shared lineup results
// ============================================================================

import { ImageResponse } from 'next/og';
import { createAdminClient } from '@/lib/supabase-admin';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contestId = searchParams.get('contestId');
  const userId = searchParams.get('userId');

  if (!contestId || !userId) {
    return new Response('Missing contestId or userId', { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch contest, entry with lineup, and user profile in parallel
  const [contestResult, entryResult, profileResult] = await Promise.all([
    supabase.from('contests').select('name').eq('id', contestId).single(),
    supabase
      .from('entries')
      .select(`
        *,
        lineup:lineups (
          total_score,
          movies:lineup_movies (
            movie:movies (title, actual_gross, salary)
          )
        )
      `)
      .eq('contest_id', contestId)
      .eq('user_id', userId)
      .single(),
    supabase.from('user_profiles').select('username').eq('user_id', userId).single(),
  ]);

  const contest = contestResult.data;
  const entry = entryResult.data;
  const profile = profileResult.data;

  if (!contest || !entry || !profile) {
    return new Response('Data not found', { status: 404 });
  }

  const lineup = Array.isArray(entry.lineup) ? entry.lineup[0] : entry.lineup;
  const totalScore = lineup?.total_score ?? 0;
  const movies = (lineup?.movies || []).map((lm: { movie: Record<string, unknown> | Record<string, unknown>[] }) => {
    const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
    return movie;
  }).sort((a: { actual_gross?: number }, b: { actual_gross?: number }) =>
    (b.actual_gross ?? 0) - (a.actual_gross ?? 0)
  );

  // Calculate rank
  const { data: allEntries } = await supabase
    .from('entries')
    .select('lineup:lineups(total_score)')
    .eq('contest_id', contestId);

  let rank = 0;
  let totalEntries = 0;
  if (allEntries) {
    const scores = allEntries
      .map((e) => {
        const l = Array.isArray(e.lineup) ? e.lineup[0] : e.lineup;
        return (l as { total_score?: number })?.total_score ?? 0;
      })
      .sort((a, b) => b - a);
    rank = scores.findIndex((s) => s === totalScore) + 1;
    totalEntries = allEntries.length;
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '1200px',
          height: '630px',
          backgroundColor: '#0f0f1a',
          color: '#f3f4f6',
          fontFamily: 'system-ui, sans-serif',
          padding: '48px 60px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#4fd1c5' }}>SHUGSY</div>
          </div>
          <div style={{ fontSize: '20px', color: '#9ca3af' }}>{contest.name}</div>
        </div>

        {/* Score Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '36px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '72px', fontWeight: 800, color: '#4fd1c5', lineHeight: 1 }}>
              {totalScore.toFixed(1)}
            </div>
            <div style={{ fontSize: '20px', color: '#9ca3af', marginTop: '4px' }}>points</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 700,
              color: rank === 1 ? '#fbbf24' : rank === 2 ? '#d1d5db' : rank === 3 ? '#fb923c' : '#f3f4f6',
            }}>
              #{rank}
            </div>
            <div style={{ fontSize: '16px', color: '#9ca3af' }}>of {totalEntries}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#f3f4f6' }}>@{profile.username}</div>
          </div>
        </div>

        {/* Movies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {movies.slice(0, 4).map((movie: { title: string; actual_gross?: number; salary: number }, i: number) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                backgroundColor: '#1a1a2e',
                borderRadius: '12px',
                borderLeft: '4px solid #4fd1c5',
              }}
            >
              <div style={{ fontSize: '22px', fontWeight: 500, color: '#f3f4f6' }}>{movie.title}</div>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ fontSize: '18px', color: '#9ca3af' }}>${(movie.salary || 0).toLocaleString()}</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#4fd1c5' }}>
                  {(movie.actual_gross ?? 0).toFixed(1)} pts
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>shugsy.com</div>
          <div style={{ fontSize: '16px', color: '#6b7280' }}>Box Office Fantasy Sports</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
