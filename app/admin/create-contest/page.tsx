// ============================================================================
// Admin: Create Contest with Movies (for testing)
// ============================================================================

import { CreateContestForm } from '@/components/create-contest-form';
import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function CreateContestPage() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Test Contest</h1>
          <p className="text-sm text-gray-600 mt-1">
            Admin page to create contests with sample movies
          </p>
        </div>

        <CreateContestForm />
      </div>
    </div>
  );
}
