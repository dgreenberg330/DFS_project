// ============================================================================
// Username Form Component - For Settings Page
// ============================================================================

'use client';

import { setUsername } from '@/actions/user-profiles';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UsernameFormProps {
  currentUsername?: string;
}

export function UsernameForm({ currentUsername }: UsernameFormProps) {
  const [username, setUsernameInput] = useState(currentUsername || '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (username === currentUsername) {
      toast.info('Username unchanged');
      return;
    }

    setLoading(true);

    const result = await setUsername(username);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success(currentUsername ? 'Username updated!' : 'Username set!');
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        required
        value={username}
        onChange={(e) => setUsernameInput(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
        placeholder="your_username"
        pattern="[a-zA-Z0-9_]{3,20}"
        title="3-20 characters, letters, numbers, and underscores only"
      />
      <button
        type="submit"
        disabled={loading || username === currentUsername}
        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : currentUsername ? 'Update' : 'Set'}
      </button>
    </form>
  );
}
