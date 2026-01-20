/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: buildCSP(),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

/**
 * Build Content Security Policy header value
 * Allows required external resources while maintaining security
 */
function buildCSP() {
  const directives = {
    // Default fallback for all fetch directives
    'default-src': ["'self'"],

    // JavaScript sources
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for GTM and JSON-LD
      'https://www.googletagmanager.com',
    ],

    // CSS and style sources
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind and inline styles
      'https://fonts.googleapis.com',
    ],

    // Font sources
    'font-src': [
      "'self'",
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],

    // API and fetch connections
    'connect-src': [
      "'self'",
      'https://*.supabase.co', // Supabase API, Auth, Realtime
      'wss://*.supabase.co', // Supabase Realtime WebSocket
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com', // GTM may load GA
      'https://analytics.google.com', // GA4
    ],

    // Image sources
    'img-src': [
      "'self'",
      'data:', // For inline images/icons
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
    ],

    // Frame sources (for GTM noscript fallback)
    'frame-src': [
      "'self'",
      'https://www.googletagmanager.com',
    ],

    // Child/worker sources
    'child-src': [
      "'self'",
      'https://www.googletagmanager.com',
    ],

    // Form submission targets
    'form-action': ["'self'"],

    // Base URI restriction
    'base-uri': ["'self'"],

    // Object/embed sources (plugins)
    'object-src': ["'none'"],

    // Manifest sources
    'manifest-src': ["'self'"],

    // Media sources (audio/video)
    'media-src': ["'self'"],

    // Frame ancestors (who can embed this site)
    'frame-ancestors': ["'none'"],

    // Upgrade insecure requests in production
    'upgrade-insecure-requests': [],
  };

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key; // For directives like upgrade-insecure-requests
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

module.exports = nextConfig;
