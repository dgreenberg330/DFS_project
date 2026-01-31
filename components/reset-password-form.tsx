// ============================================================================
// Reset Password Form - Client Component
// ============================================================================

'use client';

import { updatePassword } from '@/actions/auth';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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

    const result = await updatePassword(password);

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Password updated successfully!');
      router.push('/account');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          New Password
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
          Confirm New Password
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
          placeholder="Confirm your new password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-dark-bg bg-accent hover:bg-accent-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-surface focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}
