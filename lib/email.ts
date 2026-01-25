// ============================================================================
// Email Service - Resend Integration
// ============================================================================

import { Resend } from 'resend';

// Initialize Resend client (lazy initialization)
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - emails will be skipped');
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Email sender configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'Shugsy <noreply@shugsy.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shugsy.com';

// ============================================================================
// Email Templates
// ============================================================================

interface BaseEmailData {
  username: string;
  unsubscribeUrl: string;
}

interface LockReminderData extends BaseEmailData {
  contestName: string;
  hoursUntilLock: number;
  contestUrl: string;
}

interface ContestResultsData extends BaseEmailData {
  contestName: string;
  rank: number;
  totalEntries: number;
  score: number;
  leaderboardUrl: string;
}

interface NewContestData extends BaseEmailData {
  contestName: string;
  weekendDates: string;
  movieCount: number;
  contestUrl: string;
}

/**
 * Generate lock reminder email HTML
 */
function lockReminderTemplate(data: LockReminderData): string {
  const hoursText = data.hoursUntilLock === 1 ? '1 hour' : `${data.hoursUntilLock} hours`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lineups Lock Soon</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Lineups Lock in ${hoursText}!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="margin-top: 0;">Hey @${data.username},</p>

    <p>Don't miss out! <strong>${data.contestName}</strong> locks in <strong>${hoursText}</strong>.</p>

    <p>Make sure your lineup is set before Thursday at 8PM ET.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.contestUrl}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Contest</a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">Good luck this weekend!</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 10px 0;">
      <a href="${APP_URL}" style="color: #6b7280; text-decoration: none;">Shugsy</a> - Box Office Fantasy
    </p>
    <p style="margin: 0;">
      <a href="${data.unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from reminders</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate contest results email HTML
 */
function contestResultsTemplate(data: ContestResultsData): string {
  const rankSuffix = getRankSuffix(data.rank);
  const isWinner = data.rank === 1;
  const headerColor = isWinner ? '#059669' : '#1e40af';
  const headerText = isWinner ? 'You Won!' : 'Results Are In!';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contest Results</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, ${headerColor} 0%, ${isWinner ? '#10b981' : '#3b82f6'} 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${headerText}</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="margin-top: 0;">Hey @${data.username},</p>

    <p>Final results for <strong>${data.contestName}</strong> are in!</p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <div style="font-size: 48px; font-weight: bold; color: ${isWinner ? '#059669' : '#2563eb'};">
        ${data.rank}${rankSuffix}
      </div>
      <div style="color: #6b7280; font-size: 14px; margin-top: 4px;">
        out of ${data.totalEntries} entries
      </div>
      <div style="margin-top: 12px; font-size: 20px; font-weight: 600;">
        ${data.score.toFixed(2)} pts
      </div>
    </div>

    ${isWinner ? '<p style="text-align: center; font-size: 18px;">Congratulations on the win!</p>' : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.leaderboardUrl}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Leaderboard</a>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 10px 0;">
      <a href="${APP_URL}" style="color: #6b7280; text-decoration: none;">Shugsy</a> - Box Office Fantasy
    </p>
    <p style="margin: 0;">
      <a href="${data.unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from results</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate new contest email HTML
 */
function newContestTemplate(data: NewContestData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contest Available</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Contest Available!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="margin-top: 0;">Hey @${data.username},</p>

    <p>A new box office contest is ready for you!</p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="margin: 0 0 8px 0; font-size: 18px;">${data.contestName}</h2>
      <p style="margin: 0; color: #6b7280;">${data.weekendDates}</p>
      <p style="margin: 12px 0 0 0; font-size: 14px;"><strong>${data.movieCount} movies</strong> to choose from</p>
    </div>

    <p>Build your lineup now and predict which movies will dominate the box office!</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.contestUrl}" style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Enter Contest</a>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 10px 0;">
      <a href="${APP_URL}" style="color: #6b7280; text-decoration: none;">Shugsy</a> - Box Office Fantasy
    </p>
    <p style="margin: 0;">
      <a href="${data.unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from announcements</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// Helper Functions
// ============================================================================

function getRankSuffix(rank: number): string {
  if (rank >= 11 && rank <= 13) return 'th';
  switch (rank % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function getUnsubscribeUrl(token: string, emailType: string): string {
  return `${APP_URL}/unsubscribe/${token}?type=${emailType}`;
}

// ============================================================================
// Send Functions
// ============================================================================

export interface SendEmailResult {
  success: boolean;
  resendId?: string;
  error?: string;
}

/**
 * Send lock reminder email
 */
export async function sendLockReminderEmail(
  to: string,
  unsubscribeToken: string,
  data: Omit<LockReminderData, 'unsubscribeUrl'>
): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Email service not configured' };
  }

  const unsubscribeUrl = getUnsubscribeUrl(unsubscribeToken, 'lock_reminders');

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Lineups lock in ${data.hoursUntilLock} hours - ${data.contestName}`,
      html: lockReminderTemplate({ ...data, unsubscribeUrl }),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, resendId: result?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send contest results email
 */
export async function sendContestResultsEmail(
  to: string,
  unsubscribeToken: string,
  data: Omit<ContestResultsData, 'unsubscribeUrl'>
): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Email service not configured' };
  }

  const unsubscribeUrl = getUnsubscribeUrl(unsubscribeToken, 'contest_results');
  const isWinner = data.rank === 1;
  const subject = isWinner
    ? `You won ${data.contestName}!`
    : `Your results for ${data.contestName}`;

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: contestResultsTemplate({ ...data, unsubscribeUrl }),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, resendId: result?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send new contest email
 */
export async function sendNewContestEmail(
  to: string,
  unsubscribeToken: string,
  data: Omit<NewContestData, 'unsubscribeUrl'>
): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Email service not configured' };
  }

  const unsubscribeUrl = getUnsubscribeUrl(unsubscribeToken, 'new_contests');

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New contest: ${data.contestName}`,
      html: newContestTemplate({ ...data, unsubscribeUrl }),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, resendId: result?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
