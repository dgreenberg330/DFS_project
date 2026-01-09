// ============================================================================
// Setup Username Page - Required on First Login
// ============================================================================

import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/actions/user-profiles';
import { SetUsernameForm } from '@/components/set-username-form';
import { Header } from '@/components/header';

export default async function SetupUsernamePage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // If already has username, redirect to account
  const profile = await getUserProfile();
  if (profile) {
    redirect('/account');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Choose Your Username
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This will be displayed on the leaderboard instead of your email.
          </p>
        </div>

        <SetUsernameForm />

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Username Requirements:</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• 3-20 characters</li>
            <li>• Letters, numbers, and underscores only</li>
            <li>• Must be unique</li>
          </ul>
        </div>
        </div>
      </div>
    </div>
  );
}
