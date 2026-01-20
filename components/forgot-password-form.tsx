// ============================================================================
// Forgot Password Form - Client Component
// ============================================================================

'use client';

import { resetPassword } from '@/actions/auth';
import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await resetPassword(email);

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Check your email for the reset link!');
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="mt-8 space-y-6">
        <div className="p-4 rounded bg-green-50 text-green-800 text-center">
          <p className="font-medium">Check your email!</p>
          <p className="mt-2 text-sm">
            We've sent a password reset link to <strong>{email}</strong>.
          </p>
        </div>
        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="text-teal-600 hover:text-teal-700 hover:underline font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
          placeholder="you@example.com"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link href="/login" className="text-teal-600 hover:text-teal-700 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
