// ============================================================================
// Forgot Password Page
// ============================================================================

import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your Shugsy account password.',
  robots: { index: false },
};

interface PageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const user = await getUser();
  if (user) {
    redirect('/account');
  }

  const { error, message } = await searchParams;

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md w-full space-y-8 p-8 bg-dark-surface rounded-lg border border-dark-border">
          <div>
            <h2 className="text-center text-3xl font-bold text-gray-100">
              Reset Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {error && (
            <div className="p-4 rounded bg-amber-900/30 border border-amber-700/50 text-amber-300 text-center">
              <p className="font-medium">
                {error === 'expired' ? 'Link Expired' : 'Reset Failed'}
              </p>
              <p className="mt-1 text-sm text-amber-400">
                {message || 'Please request a new password reset link.'}
              </p>
            </div>
          )}

          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
