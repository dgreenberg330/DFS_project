// ============================================================================
// Shared Header Component
// ============================================================================

import Link from 'next/link';
import Image from 'next/image';
import { getUser } from '@/lib/supabase-server';

export async function Header() {
  const user = await getUser();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/logo_full.png"
            alt="Box Office Fantasy"
            width={180}
            height={40}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href="/account"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
