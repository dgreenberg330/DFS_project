// ============================================================================
// Unsubscribe Page - Email preference management
// ============================================================================

import { getPreferencesByToken } from '@/actions/emails';
import { TokenEmailPreferencesForm } from '@/components/email-preferences-form-token';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Preferences',
  description: 'Manage your email notification preferences',
  robots: {
    index: false,
    follow: false,
  },
};

interface UnsubscribePageProps {
  params: Promise<{ token: string }>;
}

export default async function UnsubscribePage({ params }: UnsubscribePageProps) {
  const { token } = await params;

  // Get current preferences
  const result = await getPreferencesByToken(token);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          {result.preferences ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-100 mb-2">Email Preferences</h1>
                <p className="text-gray-400">
                  Choose which emails you&apos;d like to receive from Shugsy.
                </p>
              </div>

              <TokenEmailPreferencesForm
                token={token}
                initialPreferences={result.preferences}
              />

              <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                <Link
                  href="/"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Go to Homepage
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-400"
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
                <h1 className="text-2xl font-bold text-gray-100 mb-2">Invalid Link</h1>
                <p className="text-gray-400 mb-6">
                  {result.error || 'This unsubscribe link is invalid or has expired.'}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  If you&apos;re logged in, you can manage your preferences in your{' '}
                  <Link href="/account" className="text-blue-400 hover:underline">
                    account settings
                  </Link>
                  .
                </p>
                <Link
                  href="/"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Go to Homepage
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
