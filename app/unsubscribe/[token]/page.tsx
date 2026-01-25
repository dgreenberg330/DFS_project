// ============================================================================
// Unsubscribe Page - One-click email unsubscribe
// ============================================================================

import { unsubscribeByToken } from '@/actions/emails';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unsubscribe',
  description: 'Manage your email preferences',
  robots: {
    index: false,
    follow: false,
  },
};

interface UnsubscribePageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function UnsubscribePage({ params, searchParams }: UnsubscribePageProps) {
  const { token } = await params;
  const { type } = await searchParams;

  // Process unsubscribe immediately
  const result = await unsubscribeByToken(token, type);

  const emailTypeLabel = type === 'lock_reminders'
    ? 'lock reminder'
    : type === 'contest_results'
    ? 'contest results'
    : type === 'new_contests'
    ? 'new contest'
    : 'all';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {result.success ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribed</h1>
              <p className="text-gray-600 mb-6">
                You&apos;ve been unsubscribed from {emailTypeLabel} emails.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                You can re-enable notifications anytime in your{' '}
                <Link href="/account" className="text-blue-600 hover:underline">
                  account settings
                </Link>
                .
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                {result.error || 'Unable to process your unsubscribe request.'}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                If you&apos;re logged in, you can manage your preferences in your{' '}
                <Link href="/account" className="text-blue-600 hover:underline">
                  account settings
                </Link>
                .
              </p>
            </>
          )}

          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
