// ============================================================================
// Set Username Form Component
// ============================================================================

'use client';

import { setUsername } from '@/actions/user-profiles';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SetUsernameForm() {
  const [username, setUsernameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await setUsername(username);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Success - redirect to account
      router.push('/account');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          value={username}
          onChange={(e) => setUsernameInput(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="your_username"
          pattern="[a-zA-Z0-9_]{3,20}"
          title="3-20 characters, letters, numbers, and underscores only"
        />
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 text-red-800 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Setting username...' : 'Continue'}
      </button>
    </form>
  );
}
