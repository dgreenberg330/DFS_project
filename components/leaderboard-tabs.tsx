// ============================================================================
// Leaderboard Tabs - Switch between Global and Friends view
// ============================================================================

'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface LeaderboardTabsProps {
  contestId: string;
  friendCount: number;
}

export function LeaderboardTabs({ contestId, friendCount }: LeaderboardTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('filter') || 'global';

  const handleTabChange = (filter: string) => {
    const url = filter === 'global'
      ? `/contests/${contestId}/leaderboard`
      : `/contests/${contestId}/leaderboard?filter=friends`;
    router.push(url);
  };

  return (
    <div className="flex gap-1 p-1 bg-dark-elevated rounded-lg mb-6">
      <button
        onClick={() => handleTabChange('global')}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          currentFilter === 'global'
            ? 'bg-dark-surface text-gray-100'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        Global
      </button>
      <button
        onClick={() => handleTabChange('friends')}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          currentFilter === 'friends'
            ? 'bg-dark-surface text-gray-100'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        Friends {friendCount > 0 && `(${friendCount})`}
      </button>
    </div>
  );
}
