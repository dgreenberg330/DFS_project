// ============================================================================
// Signup Page
// ============================================================================

import { SignupForm } from '@/components/signup-form';
import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a free Shugsy account to play box office fantasy sports. Pick movies, predict opening weekend grosses, and compete on the leaderboard.',
  openGraph: {
    title: 'Sign Up for Shugsy',
    description: 'Create a free account to play box office fantasy sports.',
    url: 'https://www.shugsy.com/signup',
    images: [{ url: '/shugsy-share.png', width: 1200, height: 628 }],
  },
  twitter: {
    images: [{ url: '/shugsy-share.png', width: 1200, height: 628 }],
  },
  alternates: {
    canonical: 'https://www.shugsy.com/signup',
  },
};

interface PageProps {
  searchParams: Promise<{ invite_token?: string }>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const { invite_token: inviteToken } = await searchParams;

  // If already logged in, redirect to account
  const user = await getUser();
  if (user) {
    redirect('/account');
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md w-full space-y-8 p-8 bg-dark-surface rounded-lg border border-dark-border">
          <div>
            <h2 className="text-center text-3xl font-bold text-gray-100">
              Create Account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              {inviteToken
                ? 'Sign up to connect with your friend'
                : 'Sign up to start playing'}
            </p>
          </div>

          <SignupForm inviteToken={inviteToken} />
        </div>
      </div>
    </div>
  );
}
