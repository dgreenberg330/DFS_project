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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="text-center text-3xl font-bold text-gray-900">
              Reset Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {error && (
            <div className="p-4 rounded bg-amber-50 border border-amber-200 text-amber-800 text-center">
              <p className="font-medium">
                {error === 'expired' ? 'Link Expired' : 'Reset Failed'}
              </p>
              <p className="mt-1 text-sm">
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
