// ============================================================================
// Admin Dashboard
// ============================================================================

import { getAllContests } from '@/actions/admin-contests';
import { ContestList } from '@/components/admin/contest-list';
import Link from 'next/link';

export default async function AdminDashboard() {
  const contests = await getAllContests();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Manage contests and box office data</p>
      </div>

      <div className="mb-4 sm:mb-6">
        <Link
          href="/admin/contests/new"
          className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base"
        >
          Create New Contest
        </Link>
      </div>

      {/* Contest List */}
      <ContestList contests={contests} />
    </div>
  );
}
