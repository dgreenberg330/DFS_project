// ============================================================================
// Settings Page - User Preferences
// ============================================================================

import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/actions/user-profiles';
import { EmailPreferencesForm } from '@/components/email-preferences-form';
import { SetUsernameForm } from '@/components/set-username-form';
import { Header } from '@/components/header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your Shugsy account settings, email preferences, and username.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  const profile = await getUserProfile();
  if (!profile) {
    redirect('/setup-username');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Username Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Username</h2>
          <p className="text-sm text-gray-600 mb-4">
            Current username: <span className="font-medium">@{profile.username}</span>
          </p>
          <SetUsernameForm />
          <div className="mt-4 text-xs text-gray-500">
            3-20 characters, letters, numbers, and underscores only
          </div>
        </div>

        {/* Email Notifications Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h2>
          <EmailPreferencesForm
            initialPreferences={{
              email_lock_reminders: profile.email_lock_reminders ?? true,
              email_contest_results: profile.email_contest_results ?? true,
              email_new_contests: profile.email_new_contests ?? true,
            }}
          />
        </div>

        {/* Account Info Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Email</span>
              <span className="text-gray-900">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Member since</span>
              <span className="text-gray-900">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
