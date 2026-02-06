// ============================================================================
// Settings Page - User Preferences
// ============================================================================

import { getUser, createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/actions/user-profiles';
import { NotificationPreferencesForm } from '@/components/email-preferences-form';
import { UsernameForm } from '@/components/username-form';
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

  // Check if user has any registered devices (for push notification UI)
  const supabase = await createClient();
  const { count: deviceCount } = await supabase
    .from('device_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true);

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-100 mb-6">Settings</h1>

        {/* Username Section */}
        <div className="bg-dark-surface rounded-lg border border-dark-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Username</h2>
          {profile?.username && (
            <p className="text-sm text-gray-400 mb-4">
              Current username: <span className="font-medium text-gray-200">@{profile.username}</span>
            </p>
          )}
          <UsernameForm currentUsername={profile?.username} />
          <div className="mt-4 text-xs text-gray-500">
            3-20 characters, letters, numbers, and underscores only
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-dark-surface rounded-lg border border-dark-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Notifications</h2>
          <NotificationPreferencesForm
            initialEmailPreferences={{
              email_lock_reminders: profile?.email_lock_reminders ?? true,
              email_contest_results: profile?.email_contest_results ?? true,
              email_new_contests: profile?.email_new_contests ?? true,
            }}
            initialPushPreferences={{
              push_lock_reminders: profile?.push_lock_reminders ?? true,
              push_contest_results: profile?.push_contest_results ?? true,
              push_new_contests: profile?.push_new_contests ?? true,
            }}
            hasDevices={(deviceCount ?? 0) > 0}
          />
        </div>

        {/* Account Info Section */}
        <div className="bg-dark-surface rounded-lg border border-dark-border p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span className="text-gray-100">{user.email}</span>
            </div>
            {profile?.created_at && (
              <div className="flex justify-between">
                <span className="text-gray-400">Member since</span>
                <span className="text-gray-100">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
