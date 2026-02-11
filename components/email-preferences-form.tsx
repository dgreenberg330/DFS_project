// ============================================================================
// Notification Preferences Form - Email & Push notification settings
// ============================================================================

'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { updateEmailPreferences, updatePushPreferences } from '@/actions/emails';

interface NotificationPreferencesFormProps {
  initialEmailPreferences: {
    email_lock_reminders: boolean;
    email_contest_results: boolean;
    email_new_contests: boolean;
  };
  initialPushPreferences: {
    push_lock_reminders: boolean;
    push_contest_results: boolean;
    push_new_contests: boolean;
  };
  hasDevices: boolean;
}

// Keep old export name for backwards compatibility if imported elsewhere
export const EmailPreferencesForm = NotificationPreferencesForm;

export function NotificationPreferencesForm({
  initialEmailPreferences,
  initialPushPreferences,
  hasDevices,
}: NotificationPreferencesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [emailPrefs, setEmailPrefs] = useState(initialEmailPreferences);
  const [pushPrefs, setPushPrefs] = useState(initialPushPreferences);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isIOSApp, setIsIOSApp] = useState(false);
  const [pushPermissionGranted, setPushPermissionGranted] = useState(false);

  // Detect if running inside the iOS app's WKWebView
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    if (w.isShugsyIOSApp || w.isNativeApp) {
      setIsIOSApp(true);
    }
  }, []);

  // Listen for push permission result from the iOS app
  useEffect(() => {
    if (!isIOSApp) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'pushPermissionResult' && event.data.granted) {
        setPushPermissionGranted(true);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isIOSApp]);

  const requestPushPermission = useCallback(() => {
    try {
      const w = window as unknown as Record<string, unknown>;
      const webkit = w.webkit as { messageHandlers?: { requestPushPermission?: { postMessage: (msg: Record<string, unknown>) => void } } } | undefined;
      webkit?.messageHandlers?.requestPushPermission?.postMessage({});
    } catch {
      // iOS message handler not available
    }
  }, []);

  // Push toggles are enabled if user has registered devices OR just granted permission in-app
  const pushEnabled = hasDevices || pushPermissionGranted;

  const handleEmailToggle = (key: keyof typeof emailPrefs) => {
    const newPreferences = {
      ...emailPrefs,
      [key]: !emailPrefs[key],
    };
    setEmailPrefs(newPreferences);

    startTransition(async () => {
      const result = await updateEmailPreferences({ [key]: newPreferences[key] });
      if (result.error) {
        setEmailPrefs(emailPrefs);
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Preferences updated' });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handlePushToggle = (key: keyof typeof pushPrefs) => {
    const newPreferences = {
      ...pushPrefs,
      [key]: !pushPrefs[key],
    };
    setPushPrefs(newPreferences);

    startTransition(async () => {
      const result = await updatePushPreferences({ [key]: newPreferences[key] });
      if (result.error) {
        setPushPrefs(pushPrefs);
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Preferences updated' });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const notificationItems = [
    {
      label: 'Lock Reminders',
      description: 'Get notified before contest lineups lock (if you haven\'t entered)',
      emailKey: 'email_lock_reminders' as const,
      pushKey: 'push_lock_reminders' as const,
    },
    {
      label: 'Contest Results',
      description: 'Receive your final score and rank when contests are scored',
      emailKey: 'email_contest_results' as const,
      pushKey: 'push_contest_results' as const,
    },
    {
      label: 'New Contests',
      description: 'Be notified when new contests are available',
      emailKey: 'email_new_contests' as const,
      pushKey: 'push_new_contests' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Column headers */}
      <div className="flex items-center gap-4 pb-2 border-b border-dark-border">
        <div className="flex-1" />
        <div className="w-14 text-center text-xs font-medium text-gray-400 uppercase">Email</div>
        <div className="w-14 text-center text-xs font-medium text-gray-400 uppercase">Push</div>
      </div>

      {notificationItems.map((item) => (
        <div
          key={item.emailKey}
          className="flex items-start gap-4 py-2"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-100">{item.label}</div>
            <div className="text-sm text-gray-400">{item.description}</div>
          </div>

          {/* Email toggle */}
          <div className="w-14 flex justify-center">
            <button
              type="button"
              role="switch"
              aria-checked={emailPrefs[item.emailKey]}
              aria-label={`Email ${item.label}`}
              disabled={isPending}
              onClick={() => handleEmailToggle(item.emailKey)}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-dark-surface
                ${emailPrefs[item.emailKey] ? 'bg-accent' : 'bg-dark-elevated'}
                ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                  transition duration-200 ease-in-out
                  ${emailPrefs[item.emailKey] ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* Push toggle */}
          <div className="w-14 flex justify-center">
            <button
              type="button"
              role="switch"
              aria-checked={pushPrefs[item.pushKey]}
              aria-label={`Push ${item.label}`}
              disabled={isPending || !pushEnabled}
              onClick={() => handlePushToggle(item.pushKey)}
              title={!pushEnabled ? 'Install the app to enable push notifications' : undefined}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-dark-surface
                ${!pushEnabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                ${pushPrefs[item.pushKey] && pushEnabled ? 'bg-accent' : 'bg-dark-elevated'}
                ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                  transition duration-200 ease-in-out
                  ${pushPrefs[item.pushKey] && pushEnabled ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </div>
      ))}

      {!pushEnabled && (
        isIOSApp ? (
          <button
            type="button"
            onClick={requestPushPermission}
            className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Enable Push Notifications
          </button>
        ) : (
          <p className="text-xs text-gray-500">
            Install the Shugsy app to enable push notifications.
          </p>
        )
      )}

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
