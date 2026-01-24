// ============================================================================
// Footer Component
// ============================================================================

import Link from 'next/link';
import { CookieSettingsButton } from './cookie-consent';

export function Footer() {
  return (
    <footer className="py-8 mt-auto">
      <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600 space-y-2">
        <div>
          Questions? Email{' '}
          <a
            href="mailto:support@shugsy.com"
            className="text-teal-600 hover:text-teal-700 hover:underline"
          >
            support@shugsy.com
          </a>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/terms" className="text-gray-500 hover:text-gray-700 hover:underline">
            Terms of Service
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/privacy" className="text-gray-500 hover:text-gray-700 hover:underline">
            Privacy Policy
          </Link>
          <span className="text-gray-300">|</span>
          <CookieSettingsButton />
        </div>
      </div>
    </footer>
  );
}
