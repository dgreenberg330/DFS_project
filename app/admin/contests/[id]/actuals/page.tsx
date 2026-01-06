// ============================================================================
// Admin: Enter Box Office Actuals
// ============================================================================

import { getContest } from '@/actions/contests';
import { EnterActualsForm } from '@/components/admin/enter-actuals-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EnterActualsPage({ params }: PageProps) {
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
            Actuals can only be entered for locked contests. Current status: <strong>{contest.status}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Enter Box Office Results: {contest.name}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Sunday workflow - Enter actual opening weekend grosses
        </p>
      </div>

      <EnterActualsForm contest={contest} movies={contest.movies || []} />
    </div>
  );
}
