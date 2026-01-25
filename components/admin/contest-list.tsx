// ============================================================================
// Contest List - Admin Component
// ============================================================================

'use client';

import { useState } from 'react';
import { deleteContest } from '@/actions/admin-contests';
import { lockExpiredContests, publishContest, unpublishContest } from '@/actions/contests';
import { Contest } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ContestListProps {
  contests: Contest[];
}

export function ContestList({ contests: initialContests }: ContestListProps) {
  const router = useRouter();
  const [contests, setContests] = useState(initialContests);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [lockLoading, setLockLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleLockExpired() {
    setLockLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const lockedIds = await lockExpiredContests();

      if (lockedIds.length === 0) {
        setSuccessMessage('No contests needed locking. All contests are already locked or in the future.');
      } else {
        setSuccessMessage(`Successfully locked ${lockedIds.length} contest(s)!`);
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to lock contests');
    } finally {
      setLockLoading(false);
    }
  }

  async function handleDelete(contest: Contest) {
    if (!confirm(`Delete "${contest.name}"? This will also delete all movies. This cannot be undone.`)) {
      return;
    }

    setDeleteLoading(contest.id);
    setError(null);

    try {
      await deleteContest(contest.id);
      setContests(contests.filter(c => c.id !== contest.id));
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete contest');
    } finally {
      setDeleteLoading(null);
    }
  }

  async function handlePublish(contest: Contest) {
    setPublishLoading(contest.id);
    setError(null);
    setSuccessMessage(null);

    try {
      await publishContest(contest.id);
      setContests(contests.map(c => c.id === contest.id ? { ...c, published: true } : c));
      setSuccessMessage(`"${contest.name}" has been published!`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to publish contest');
    } finally {
      setPublishLoading(null);
    }
  }

  async function handleUnpublish(contest: Contest) {
    if (!confirm(`Unpublish "${contest.name}"? It will be hidden from users.`)) {
      return;
    }

    setPublishLoading(contest.id);
    setError(null);
    setSuccessMessage(null);

    try {
      await unpublishContest(contest.id);
      setContests(contests.map(c => c.id === contest.id ? { ...c, published: false } : c));
      setSuccessMessage(`"${contest.name}" has been unpublished.`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to unpublish contest');
    } finally {
      setPublishLoading(null);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Contests</h2>
          <button
            onClick={handleLockExpired}
            disabled={lockLoading}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {lockLoading ? 'Locking...' : 'Lock Expired Contests'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">{successMessage}</p>
        </div>
      )}

      {contests.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">
          No contests yet. Create your first contest to get started.
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {contests.map((contest) => (
            <div key={contest.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{contest.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Status:{' '}
                    <span
                      className={`capitalize font-medium ${
                        contest.status === 'upcoming'
                          ? 'text-blue-600'
                          : contest.status === 'locked'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    >
                      {contest.status}
                    </span>
                    {' · '}
                    <span
                      className={`font-medium ${
                        contest.published ? 'text-green-600' : 'text-orange-600'
                      }`}
                    >
                      {contest.published ? 'Published' : 'Draft'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Lock: {new Date(contest.lock_time).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex gap-3 items-center">
                  {!contest.published && contest.status === 'upcoming' && (
                    <button
                      onClick={() => handlePublish(contest)}
                      disabled={publishLoading === contest.id}
                      className="text-sm text-green-600 hover:underline font-medium disabled:opacity-50"
                    >
                      {publishLoading === contest.id ? 'Publishing...' : 'Publish'}
                    </button>
                  )}
                  {contest.published && contest.status === 'upcoming' && (
                    <button
                      onClick={() => handleUnpublish(contest)}
                      disabled={publishLoading === contest.id}
                      className="text-sm text-orange-600 hover:underline font-medium disabled:opacity-50"
                    >
                      {publishLoading === contest.id ? 'Unpublishing...' : 'Unpublish'}
                    </button>
                  )}
                  <Link
                    href={`/admin/contests/${contest.id}/movies`}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    Movies
                  </Link>
                  {contest.status === 'locked' && (
                    <>
                      <Link
                        href={`/admin/contests/${contest.id}/estimates`}
                        className="text-sm text-purple-600 hover:underline font-medium"
                      >
                        Estimates
                      </Link>
                      <Link
                        href={`/admin/contests/${contest.id}/actuals`}
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        Actuals
                      </Link>
                      <Link
                        href={`/admin/contests/${contest.id}/score`}
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        Score
                      </Link>
                    </>
                  )}
                  {contest.status === 'resolved' && (
                    <Link
                      href={`/contests/${contest.id}/leaderboard`}
                      className="text-sm text-green-600 hover:underline font-medium"
                    >
                      Leaderboard
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(contest)}
                    disabled={deleteLoading === contest.id}
                    className="text-sm text-red-600 hover:underline font-medium disabled:opacity-50"
                  >
                    {deleteLoading === contest.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
