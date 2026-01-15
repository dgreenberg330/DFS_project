// ============================================================================
// Shared Header Component
// ============================================================================

import Link from 'next/link';
import Image from 'next/image';
import { getUser } from '@/lib/supabase-server';

export async function Header() {
  const user = await getUser();

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-500 focus:text-white focus:rounded">
        Skip to content
      </a>
      <header className="bg-gray-900 border-b border-gray-800">
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
              <Link
                href="/account"
                className="text-sm text-gray-300 hover:text-teal-400 transition-colors"
              >
                Account
              </Link>
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
