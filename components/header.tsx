// ============================================================================
// Shared Header Component
// ============================================================================

import Link from 'next/link';
import { getUser } from '@/lib/supabase-server';

export async function Header() {
  const user = await getUser();

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-1 flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <img
            src="/logo_full.png?v=2"
            alt="Box Office Fantasy"
            className="h-16 w-auto"
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
      </div>
    </header>
  );
}
