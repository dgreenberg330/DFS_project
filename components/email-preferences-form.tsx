// ============================================================================
// Email Preferences Form - User email notification settings
// ============================================================================

'use client';

import { useState, useTransition } from 'react';
import { updateEmailPreferences } from '@/actions/emails';

interface EmailPreferencesFormProps {
  initialPreferences: {
    email_lock_reminders: boolean;
    email_contest_results: boolean;
    email_new_contests: boolean;
  };
}

export function EmailPreferencesForm({ initialPreferences }: EmailPreferencesFormProps) {
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
      const result = await updateEmailPreferences({ [key]: newPreferences[key] });
      if (result.error) {
        // Revert on error
        setPreferences(preferences);
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Preferences updated' });
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

  return (
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
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-dark-surface
              ${preferences[item.key] ? 'bg-accent' : 'bg-dark-elevated'}
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

      {/* Status message */}
      {message && (
        <div
          className={`text-sm py-2 px-3 rounded ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-400'
              : 'bg-red-900/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
