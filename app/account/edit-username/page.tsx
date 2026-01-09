// ============================================================================
// Edit Username Page
// ============================================================================

import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/actions/user-profiles';
import { SetUsernameForm } from '@/components/set-username-form';
import { Header } from '@/components/header';

export default async function EditUsernamePage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getUserProfile();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {profile ? 'Edit Username' : 'Set Username'}
          </h2>
          {profile && (
            <p className="text-sm text-gray-600 mb-6">
              Current username: <span className="font-medium">@{profile.username}</span>
            </p>
          )}

          <SetUsernameForm />

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
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
