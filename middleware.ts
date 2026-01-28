// ============================================================================
// Middleware - Auth, Security Headers & Rate Limiting
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client (only if env vars are set)
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limiter for auth pages (login, signup, forgot-password)
// Note: Actual auth attempts have stricter action-level limiting (5/min) in actions/auth.ts
const rateLimiters = redis
  ? {
      // Page-level limit for auth routes: 30 requests per minute
      auth: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '1 m'),
        prefix: 'ratelimit:auth',
      }),
    }
  : null;

/**
 * Generate a cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

/**
 * Build Content Security Policy with nonce
 */
function buildCSP(nonce: string): string {
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'", // Allows scripts loaded by nonced scripts
      'https://www.googletagmanager.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind/inline styles (no JS risk)
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://analytics.google.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://image.tmdb.org',
    ],
    'frame-src': [
      "'self'",
      'https://www.googletagmanager.com',
    ],
    'child-src': [
      "'self'",
      'https://www.googletagmanager.com',
    ],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  };

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return '127.0.0.1';
}

/**
 * Middleware to handle Supabase auth session refresh, security headers, and rate limiting
 */
export async function middleware(request: NextRequest) {
  // Generate nonce for this request
  const nonce = generateNonce();
  const pathname = request.nextUrl.pathname;

  // Check if user has pending password reset via cookie (fast path)
  const pendingResetCookie = request.cookies.get('pending_password_reset')?.value === 'true';

  // We'll check user metadata later after supabase client is created
  let pendingResetMetadata = false;

  // Apply rate limiting only to auth routes (login, signup, forgot-password)
  // General browsing is not rate limited - action-level limits protect against abuse
  if (rateLimiters) {
    const isAuthRoute = pathname.startsWith('/login')
      || pathname.startsWith('/signup')
      || pathname.startsWith('/forgot-password');

    if (isAuthRoute) {
      const ip = getClientIP(request);
      const { success, limit, reset } = await rateLimiters.auth.limit(ip);

      if (!success) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
          },
        });
      }
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Helper to set security headers on a response
  const setSecurityHeaders = (res: NextResponse) => {
    res.headers.set('x-nonce', nonce);
    res.headers.set('Content-Security-Policy', buildCSP(nonce));
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('X-DNS-Prefetch-Control', 'on');
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    res.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()'
    );
  };

  // Set initial security headers
  setSecurityHeaders(response);

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          setSecurityHeaders(response);
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          setSecurityHeaders(response);
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session and check for pending password reset
  const { data: { user } } = await supabase.auth.getUser();

  // Check user metadata for pending reset (fallback if cookies disabled)
  if (user?.user_metadata?.pending_password_reset) {
    pendingResetMetadata = true;
  }

  // Redirect to reset-password if pending reset (from cookie or metadata)
  if ((pendingResetCookie || pendingResetMetadata) && !pathname.startsWith('/account/reset-password')) {
    if (!pathname.startsWith('/auth/callback') && !pathname.startsWith('/_next')) {
      return NextResponse.redirect(new URL('/account/reset-password', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
