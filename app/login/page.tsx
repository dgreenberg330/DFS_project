// ============================================================================
// Login Page - Email Magic Link
// ============================================================================

import { LoginForm } from '@/components/login-form';
import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Shugsy to play box office fantasy sports. Create lineups, predict opening weekend grosses, and compete on the leaderboard.',
  openGraph: {
    title: 'Sign In to Shugsy',
    description: 'Sign in to play free box office fantasy sports.',
    url: 'https://www.shugsy.com/login',
    images: ['/shugsy-share.png?v=2'],
  },
  twitter: {
    images: ['/shugsy-share.png?v=2'],
  },
  alternates: {
    canonical: 'https://www.shugsy.com/login',
  },
};

export default async function LoginPage() {
  // If already logged in, redirect to account
  const user = await getUser();
  if (user) {
    redirect('/account');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center py-12">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to sign in
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-gray-500">
          No password required. We'll send you a secure link to sign in.
        </p>
      </div>
      </div>
    </div>
  );
}