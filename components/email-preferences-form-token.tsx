// ============================================================================
// Token-based Email Preferences Form - Unsubscribe page variant
// ============================================================================

'use client';

import { useState, useTransition } from 'react';
import { updatePreferencesByToken } from '@/actions/emails';

interface TokenEmailPreferencesFormProps {
  token: string;
  initialPreferences: {
    email_lock_reminders: boolean;
    email_contest_results: boolean;
    email_new_contests: boolean;
  };
}

export function TokenEmailPreferencesForm({ token, initialPreferences }: TokenEmailPreferencesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = (key: keyof typeof preferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);

    startTransition(async () => {
      const result = await updatePreferencesByToken(token, { [key]: newPreferences[key] });
      if (!result.success) {
        // Revert on error
        setPreferences(preferences);
        setMessage({ type: 'error', text: result.error || 'Failed to update preferences' });
      } else {
        setMessage({ type: 'success', text: 'Preferences updated' });
      }

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleUnsubscribeAll = () => {
    const allOff = {
      email_lock_reminders: false,
      email_contest_results: false,
      email_new_contests: false,
    };
    setPreferences(allOff);

    startTransition(async () => {
      const result = await updatePreferencesByToken(token, allOff);
      if (!result.success) {
        // Revert on error
        setPreferences(preferences);
        setMessage({ type: 'error', text: result.error || 'Failed to update preferences' });
      } else {
        setMessage({ type: 'success', text: 'Unsubscribed from all emails' });
      }

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const toggleItems = [
    {
      key: 'email_lock_reminders' as const,
      label: 'Lock Reminders',
      description: 'Get notified before contest lineups lock (if you haven\'t entered)',
    },
    {
      key: 'email_contest_results' as const,
      label: 'Contest Results',
      description: 'Receive your final score and rank when contests are scored',
    },
    {
      key: 'email_new_contests' as const,
      label: 'New Contests',
      description: 'Be notified when new contests are available',
    },
  ];

  const anyEnabled = preferences.email_lock_reminders ||
                     preferences.email_contest_results ||
                     preferences.email_new_contests;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {toggleItems.map((item) => (
          <div
            key={item.key}
            className="flex items-start justify-between gap-4 py-2"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-100">{item.label}</div>
              <div className="text-sm text-gray-400">{item.description}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences[item.key]}
              disabled={isPending}
              onClick={() => handleToggle(item.key)}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
                ${preferences[item.key] ? 'bg-blue-600' : 'bg-gray-600'}
                ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                  transition duration-200 ease-in-out
                  ${preferences[item.key] ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`text-sm py-2 px-3 rounded ${
            message.type === 'success'
              ? 'bg-green-900/50 text-green-300 border border-green-700'
              : 'bg-red-900/50 text-red-300 border border-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Unsubscribe from all button */}
      {anyEnabled && (
        <div className="pt-4 border-t border-gray-700">
          <button
            type="button"
            disabled={isPending}
            onClick={handleUnsubscribeAll}
            className={`
              w-full py-2 px-4 rounded-lg font-medium text-sm
              bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white
              transition-colors duration-200
              ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            Unsubscribe from all emails
          </button>
        </div>
      )}
    </div>
  );
}
