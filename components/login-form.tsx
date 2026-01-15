// ============================================================================
// Login Form - Client Component
// ============================================================================

'use client';

import { sendMagicLink } from '@/actions/auth';
import { useState } from 'react';
import { toast } from 'sonner';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const result = await sendMagicLink(email);

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Check your email for the sign in link!');
      setSuccess(true);
      setEmail(''); // Clear form
    }
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
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
          placeholder="you@example.com"
        />
      </div>

      {success && (
        <div className="p-3 rounded bg-green-50 text-green-800" role="alert" aria-live="polite">
          Check your email for the sign in link!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : 'Send Email Confirmation'}
      </button>
    </form>
  );
}