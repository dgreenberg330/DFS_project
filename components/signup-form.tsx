// ============================================================================
// Signup Form - Client Component
// ============================================================================

'use client';

import { signUp } from '@/actions/auth';
import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!ageConfirmed) {
      toast.error('You must confirm you are 18 or older to continue.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, and a number.');
      return;
    }

    setLoading(true);
    setEmailExistsError(false);

    const result = await signUp(email, password, username);

    setLoading(false);

    if (result.error) {
      if ('code' in result && result.code === 'EMAIL_EXISTS') {
        setEmailExistsError(true);
      } else {
        toast.error(result.error);
      }
    } else {
      toast.success(result.message || 'Check your email to confirm your account!');
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="mt-8 space-y-6">
        <div className="p-4 rounded bg-green-900/30 border border-green-700/50 text-green-300 text-center">
          <p className="font-medium">Check your email!</p>
          <p className="mt-2 text-sm text-green-400">
            We've sent a confirmation link to <strong>{email}</strong>.
            Click the link to activate your account.
          </p>
        </div>
        <p className="text-center text-sm text-gray-400">
          Already confirmed?{' '}
          <Link href="/login" className="text-accent hover:text-accent-light hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    );
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
        <label htmlFor="username" className="block text-sm font-medium text-gray-300">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-gray-100 placeholder-gray-500 text-base"
          placeholder="Choose a username"
        />
        <p className="mt-1 text-xs text-gray-500">3-20 characters, letters, numbers, and underscores only</p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-gray-100 placeholder-gray-500 text-base"
          placeholder="Min 8 chars, upper, lower, number"
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">
          Confirm Password
        </label>
        <input
          id="confirm-password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-gray-100 placeholder-gray-500 text-base"
          placeholder="Confirm your password"
        />
      </div>

      <div className="flex items-start">
        <input
          id="age-confirmation"
          name="age-confirmation"
          type="checkbox"
          checked={ageConfirmed}
          onChange={(e) => setAgeConfirmed(e.target.checked)}
          className="h-4 w-4 mt-0.5 text-accent bg-dark-elevated border-dark-border rounded focus:ring-accent focus:ring-offset-dark-surface"
        />
        <label htmlFor="age-confirmation" className="ml-2 block text-sm text-gray-300">
          I confirm that I am 18 years of age or older and agree to the{' '}
          <Link href="/terms" className="text-accent hover:text-accent-light hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-accent hover:text-accent-light hover:underline">
            Privacy Policy
          </Link>
        </label>
      </div>

      {emailExistsError && (
        <div className="p-3 rounded bg-red-900/30 border border-red-700/50 text-red-300 text-sm">
          <p>An account with this email already exists.</p>
          <p className="mt-1">
            <Link href="/login" className="font-medium underline hover:text-red-200">
              Sign in
            </Link>
            {' or '}
            <Link href="/forgot-password" className="font-medium underline hover:text-red-200">
              reset your password
            </Link>
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !ageConfirmed}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-dark-bg bg-accent hover:bg-accent-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-surface focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-accent hover:text-accent-light hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
