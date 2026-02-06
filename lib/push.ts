// ============================================================================
// Push Notification Service - APNs Integration
// ============================================================================
// Sends push notifications via Apple Push Notification service (APNs).
// Uses HTTP/2 with JWT-based authentication (.p8 token auth).
// Mirrors lib/email.ts pattern: lazy init, graceful degradation.
// ============================================================================

import * as http2 from 'http2';
import * as crypto from 'crypto';
import * as fs from 'fs';

// APNs endpoints
const APNS_HOST_PRODUCTION = 'api.push.apple.com';
const APNS_HOST_SANDBOX = 'api.sandbox.push.apple.com';

// JWT token cache (APNs tokens are valid for up to 1 hour)
let cachedToken: { jwt: string; issuedAt: number } | null = null;
const TOKEN_TTL_MS = 50 * 60 * 1000; // Refresh every 50 minutes

// Signing key cache
let signingKey: string | null = null;

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return !!(
    getSigningKey() &&
    process.env.APNS_KEY_ID &&
    process.env.APNS_TEAM_ID &&
    process.env.APNS_BUNDLE_ID
  );
}

/**
 * Get the APNs signing key (.p8 file content)
 */
function getSigningKey(): string | null {
  if (signingKey) return signingKey;

  // Option 1: Base64-encoded key in env var (Vercel)
  if (process.env.APNS_SIGNING_KEY) {
    try {
      signingKey = Buffer.from(process.env.APNS_SIGNING_KEY, 'base64').toString('utf-8');
      return signingKey;
    } catch {
      console.error('Failed to decode APNS_SIGNING_KEY from base64');
      return null;
    }
  }

  // Option 2: File path (local dev)
  if (process.env.APNS_KEY_PATH) {
    try {
      signingKey = fs.readFileSync(process.env.APNS_KEY_PATH, 'utf-8');
      return signingKey;
    } catch {
      console.error(`Failed to read APNs key from ${process.env.APNS_KEY_PATH}`);
      return null;
    }
  }

  return null;
}

/**
 * Generate a JWT for APNs authentication
 */
function generateApnsJwt(): string | null {
  const key = getSigningKey();
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;

  if (!key || !keyId || !teamId) return null;

  // Check cache
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && (Date.now() - cachedToken.issuedAt) < TOKEN_TTL_MS) {
    return cachedToken.jwt;
  }

  // Build JWT header and payload
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iss: teamId, iat: now })).toString('base64url');

  // Sign with ES256
  const signer = crypto.createSign('SHA256');
  signer.update(`${header}.${payload}`);
  const signature = signer.sign({ key, dsaEncoding: 'ieee-p1363' }, 'base64url');

  const jwt = `${header}.${payload}.${signature}`;
  cachedToken = { jwt, issuedAt: Date.now() };

  return jwt;
}

export interface PushPayload {
  title: string;
  body: string;
  deepLink?: string;
  badge?: number;
  sound?: string;
}

export interface PushResult {
  success: boolean;
  apnsId?: string;
  error?: string;
  reason?: string;
}

/**
 * Send a push notification to a single device via APNs HTTP/2
 */
export async function sendPushNotification(
  deviceToken: string,
  payload: PushPayload
): Promise<PushResult> {
  if (!isPushConfigured()) {
    return { success: false, error: 'Push notifications not configured' };
  }

  const jwt = generateApnsJwt();
  if (!jwt) {
    return { success: false, error: 'Failed to generate APNs JWT' };
  }

  const bundleId = process.env.APNS_BUNDLE_ID!;
  const host = process.env.NODE_ENV === 'production' ? APNS_HOST_PRODUCTION : APNS_HOST_SANDBOX;

  // Build APNs payload
  const apnsPayload = JSON.stringify({
    aps: {
      alert: {
        title: payload.title,
        body: payload.body,
      },
      sound: payload.sound || 'default',
      ...(payload.badge !== undefined ? { badge: payload.badge } : {}),
    },
    // Custom data for deep linking
    ...(payload.deepLink ? { deep_link: payload.deepLink } : {}),
  });

  return new Promise<PushResult>((resolve) => {
    let client: http2.ClientHttp2Session | null = null;

    try {
      client = http2.connect(`https://${host}`);

      client.on('error', (err) => {
        resolve({ success: false, error: `Connection error: ${err.message}` });
      });

      const req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${deviceToken}`,
        'authorization': `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      });

      let responseData = '';
      let statusCode = 0;
      let apnsId: string | undefined;

      req.on('response', (headers) => {
        statusCode = headers[':status'] as number;
        apnsId = headers['apns-id'] as string | undefined;
      });

      req.on('data', (chunk) => {
        responseData += chunk;
      });

      req.on('end', () => {
        client?.close();

        if (statusCode === 200) {
          resolve({ success: true, apnsId });
        } else {
          let reason = 'Unknown error';
          try {
            const parsed = JSON.parse(responseData);
            reason = parsed.reason || reason;
          } catch {
            // Ignore parse errors
          }
          resolve({
            success: false,
            apnsId,
            error: `APNs returned ${statusCode}: ${reason}`,
            reason,
          });
        }
      });

      req.on('error', (err) => {
        client?.close();
        resolve({ success: false, error: `Request error: ${err.message}` });
      });

      // Set a timeout
      req.setTimeout(10000, () => {
        req.close();
        client?.close();
        resolve({ success: false, error: 'APNs request timed out' });
      });

      req.write(apnsPayload);
      req.end();
    } catch (err) {
      client?.close();
      resolve({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });
}
