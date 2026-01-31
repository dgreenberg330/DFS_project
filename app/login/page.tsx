// ============================================================================
// Login Page - Email + Password
// ============================================================================

import { LoginForm } from '@/components/login-form';
import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Shugsy to play box office fantasy sports. Create lineups, predict opening weekend grosses, and compete on the leaderboard.',
  openGraph: {
    title: 'Sign In to Shugsy',
    description: 'Sign in to play free box office fantasy sports.',
    url: 'https://www.shugsy.com/login',
    images: [{ url: '/shugsy-share.png', width: 1200, height: 628 }],
  },
  twitter: {
    images: [{ url: '/shugsy-share.png', width: 1200, height: 628 }],
  },
  alternates: {
    canonical: 'https://www.shugsy.com/login',
  },
};

const ERROR_MESSAGES: Record<string, { title: string; message: string; showResetLink?: boolean }> = {
  link_expired: {
    title: 'Link Expired',
    message: 'Your verification link has expired.',
    showResetLink: true,
  },
  auth_failed: {
    title: 'Authentication Failed',
    message: 'Unable to verify your account. Please try again.',
  },
  missing_code: {
    title: 'Invalid Link',
    message: 'The link appears to be incomplete. Please request a new one.',
  },
  unexpected_error: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
};

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  // If already logged in, redirect to account
  const user = await getUser();
  if (user) {
    redirect('/account');
  }

  const { error } = await searchParams;
  const errorInfo = error ? ERROR_MESSAGES[error] : null;

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md w-full space-y-8 p-8 bg-dark-surface rounded-lg border border-dark-border">
          <div>
            <h2 className="text-center text-3xl font-bold text-gray-100">
              Sign In
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Enter your email and password
            </p>
          </div>

          {errorInfo && (
            <div className="p-4 rounded bg-amber-900/30 border border-amber-700/50 text-amber-300 text-center">
              <p className="font-medium">{errorInfo.title}</p>
              <p className="mt-1 text-sm text-amber-400">{errorInfo.message}</p>
              {errorInfo.showResetLink && (
                <Link
                  href="/forgot-password"
                  className="mt-2 inline-block text-sm text-accent hover:text-accent-light hover:underline font-medium"
                >
                  Request a new reset link
                </Link>
              )}
            </div>
          )}

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
