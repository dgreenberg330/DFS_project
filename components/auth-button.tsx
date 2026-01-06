// ============================================================================
// Auth Button - Shows Login or Sign Out based on auth state
// Can be used in navigation/header
// ============================================================================

'use client';

import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (user) {
    return (
      <a
        href="/account"
        className="text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        Account
      </a>
    );
  }

  return (
    <a
      href="/login"
      className="text-sm font-medium text-blue-600 hover:text-blue-700"
    >
      Sign In
    </a>
  );
}
