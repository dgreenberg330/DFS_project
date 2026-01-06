// ============================================================================
// Admin: Manage Movies for Contest
// ============================================================================

import { getContest } from '@/actions/contests';
import { ManageMoviesForm } from '@/components/admin/manage-movies-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ManageMoviesPage({ params }: PageProps) {
  const { id: contestId } = await params;
  const contest = await getContest(contestId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Manage Movies: {contest.name}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Add, edit, or remove movies from this contest
        </p>
      </div>

      <ManageMoviesForm contest={contest} movies={contest.movies || []} />
    </div>
  );
}
