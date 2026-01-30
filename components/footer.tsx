// ============================================================================
// Footer Component
// ============================================================================

import Link from 'next/link';
import { CookieSettingsButton } from './cookie-consent';

export function Footer() {
  return (
    <footer className="py-8 mt-auto">
      <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500 space-y-2">
        <div>
          Questions? Email{' '}
          <a
            href="mailto:support@shugsy.com"
            className="text-accent hover:text-accent-light hover:underline"
          >
            support@shugsy.com
          </a>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/terms" className="text-gray-500 hover:text-gray-400 hover:underline">
            Terms of Service
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/privacy" className="text-gray-500 hover:text-gray-400 hover:underline">
            Privacy Policy
          </Link>
          <span className="text-gray-600">|</span>
          <CookieSettingsButton />
        </div>
        <div className="pt-2 text-xs text-gray-600">
          Movie data by{' '}
          <Link href="/credits" className="text-gray-500 hover:text-gray-400 hover:underline">
            TMDB
          </Link>
        </div>
      </div>
    </footer>
  );
}
