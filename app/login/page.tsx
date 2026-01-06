// ============================================================================
// Login Page - Email Magic Link
// ============================================================================

import { LoginForm } from '@/components/login-form';
import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  // If already logged in, redirect to account
  const user = await getUser();
  if (user) {
    redirect('/account');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to receive a magic link
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-gray-500">
          No password required. We'll send you a secure link to sign in.
        </p>
      </div>
    </div>
  );
}