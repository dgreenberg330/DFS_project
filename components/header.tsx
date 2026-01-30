// ============================================================================
// Shared Header Component
// ============================================================================

import Link from 'next/link';
import Image from 'next/image';
import { getUser } from '@/lib/supabase-server';
import { getUserEntryCount, getUserCohort } from '@/actions/account';
import { UserPropertiesTracker } from '@/components/user-properties-tracker';
import { AccountDropdown } from '@/components/account-dropdown';

export async function Header() {
  const user = await getUser();

  // Fetch analytics data - wrapped in try-catch to never crash the page
  let entryCount = 0;
  let userCohort = 0;
  if (user) {
    try {
      [entryCount, userCohort] = await Promise.all([
        getUserEntryCount(),
        getUserCohort(),
      ]);
    } catch (error) {
      // Silently fail - analytics should never crash the page
      console.error('Failed to fetch user analytics data:', error);
    }
  }

  return (
    <>
      {/* Track user properties for GA4 custom dimensions */}
      {user && (entryCount > 0 || userCohort > 0) && (
        <UserPropertiesTracker contestSequence={entryCount} userCohort={userCohort} />
      )}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-500 focus:text-white focus:rounded">
        Skip to content
      </a>
      <header className="bg-dark-surface border-b border-dark-border">
        <nav className="max-w-4xl mx-auto px-4 py-1 flex items-center justify-between" aria-label="Main navigation">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Image
              src="/logo_full.png"
              alt="Shugsy - Fantasy Sports for the Box Office"
              width={160}
              height={64}
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <AccountDropdown />
            ) : (
              <Link
                href="/login"
                className="text-sm px-4 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-400 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </header>
    </>
  );
}
