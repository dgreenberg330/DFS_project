'use client';

import { useState, useEffect } from 'react';

const GTM_ID = 'GTM-WB3PXBCV';
const CONSENT_KEY = 'cookie_consent';

type ConsentStatus = 'accepted' | 'declined' | null;

function loadGTM() {
  if (typeof window === 'undefined' || window.dataLayer) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);
}

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentStatus>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentStatus;
    setConsent(stored);

    // Load GTM if already accepted or if GPC is not set
    if (stored === 'accepted') {
      loadGTM();
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsent('accepted');
    loadGTM();
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setConsent('declined');
  };

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted || consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-center sm:text-left">
          We use cookies to analyze site traffic and improve your experience.{' '}
          <a href="/privacy" className="underline hover:text-gray-300">Learn more</a>
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm border border-gray-500 rounded hover:bg-gray-800 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-teal-600 rounded hover:bg-teal-700 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsButton() {
  const resetConsent = () => {
    localStorage.removeItem(CONSENT_KEY);
    window.location.reload();
  };

  return (
    <button
      onClick={resetConsent}
      className="text-gray-500 hover:text-gray-700 hover:underline"
    >
      Cookie Settings
    </button>
  );
}
