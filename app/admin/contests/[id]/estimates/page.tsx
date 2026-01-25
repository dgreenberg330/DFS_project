// ============================================================================
// Admin: Enter Daily Estimates
// ============================================================================

import { getContest } from '@/actions/contests';
import { requireAdmin } from '@/lib/admin';
import { EnterEstimatesForm } from '@/components/admin/enter-estimates-form';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EnterEstimatesPage({ params }: PageProps) {
  await requireAdmin();

  const { id: contestId } = await params;
  const contest = await getContest(contestId);

  // Validate contest is locked
  if (contest.status !== 'locked') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">
            Contest Not Locked
          </h2>
          <p className="text-yellow-800">
            Daily estimates can only be entered for locked contests. Current status:{' '}
            <strong>{contest.status}</strong>
          </p>
        </div>
        <div className="mt-6">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-700"
          >
            &larr; Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/admin" className="hover:text-gray-900">
            Admin
          </Link>
          <span>/</span>
          <span>{contest.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Enter Daily Estimates
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Weekend workflow - Enter box office estimates as they come in
        </p>
      </div>

      <EnterEstimatesForm contest={contest} movies={contest.movies || []} />
    </div>
  );
}
