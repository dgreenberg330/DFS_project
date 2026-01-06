// ============================================================================
// Admin: Create New Contest
// ============================================================================

import { CreateContestForm } from '@/components/admin/create-contest-form';

export default function NewContestPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Contest</h1>
        <p className="text-sm text-gray-600 mt-1">
          Set up a new weekend contest with automatic lock time calculation
        </p>
      </div>

      <CreateContestForm />
    </div>
  );
}
