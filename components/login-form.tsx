// ============================================================================
// Login Form - Client Component
// ============================================================================

'use client';

import { signIn } from '@/actions/auth';
import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await signIn(email, password);

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Signed in successfully!');
      router.push('/account');
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-gray-100 placeholder-gray-500 text-base"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-gray-100 placeholder-gray-500 text-base"
          placeholder="Enter your password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-dark-bg bg-accent hover:bg-accent-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-surface focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="text-center text-sm space-y-2">
        <p className="text-gray-400">
          Don't have an account?{' '}
          <Link href="/signup" className="text-accent hover:text-accent-light hover:underline font-medium">
            Sign up
          </Link>
        </p>
        <p>
          <Link
            href="/forgot-password"
            className="text-accent hover:text-accent-light hover:underline"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </form>
  );
}
