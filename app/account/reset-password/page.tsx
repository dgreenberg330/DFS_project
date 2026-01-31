// ============================================================================
// Reset Password Page (after clicking email link)
// ============================================================================

import { ResetPasswordForm } from '@/components/reset-password-form';
import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Set New Password',
  description: 'Set a new password for your Shugsy account.',
  robots: { index: false },
};

export default async function ResetPasswordPage() {
  // User must be authenticated (via reset link) to access this page
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md w-full space-y-8 p-8 bg-dark-surface rounded-lg border border-dark-border">
          <div>
            <h2 className="text-center text-3xl font-bold text-gray-100">
              Set New Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Enter your new password below
            </p>
          </div>

          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
