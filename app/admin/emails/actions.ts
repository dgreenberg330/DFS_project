// ============================================================================
// Email Preview Server Actions
// ============================================================================

'use server';

import { checkAdminAccess } from '@/lib/admin';
import { Resend } from 'resend';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.shugsy.com';
const FROM_EMAIL = process.env.EMAIL_FROM || 'Shugsy <team@shugsy.com>';

// Sample data for previews
const SAMPLE_DATA = {
  username: 'moviefan123',
  contestName: 'Weekend of Jan 24-26, 2025',
  unsubscribeUrl: `${APP_URL}/unsubscribe/sample-token?type=lock_reminders`,
};

function getRankSuffix(rank: number): string {
  if (rank >= 11 && rank <= 13) return 'th';
  switch (rank % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// ============================================================================
// Templates (duplicated for preview - keep in sync with lib/email.ts)
// ============================================================================

function lockReminderTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lineups Lock Soon</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #7c3aed; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">This Weekend's Contest Locks in 3 hours!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="margin-top: 0;">Hey @${SAMPLE_DATA.username},</p>

    <p>This weekend's contest locks in <strong>3 hours</strong>.</p>

    <p>Make sure your lineup is set before Thursday at 8PM ET.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/contests/sample" style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Contest</a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">Good luck this weekend!</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 10px 0;">
      <a href="${APP_URL}" style="color: #6b7280; text-decoration: none;">Shugsy</a> - Box Office Fantasy
    </p>
    <p style="margin: 0;">
      <a href="${SAMPLE_DATA.unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from reminders</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

function contestResultsTemplate(isWinner: boolean = false): string {
  const rank = isWinner ? 1 : 3;
  const rankSuffix = getRankSuffix(rank);
  const headerColor = isWinner ? '#059669' : '#7c3aed';
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
  <div style="background: ${headerColor}; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${headerText}</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="margin-top: 0;">Hey @${SAMPLE_DATA.username},</p>

    <p>Final results for this weekend are in!</p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <div style="font-size: 48px; font-weight: bold; color: ${isWinner ? '#059669' : '#7c3aed'};">
        ${rank}${rankSuffix}
      </div>
      <div style="color: #6b7280; font-size: 14px; margin-top: 4px;">
        out of 42 entries
      </div>
      <div style="margin-top: 12px; font-size: 20px; font-weight: 600;">
        87.50 pts
      </div>
    </div>

    ${isWinner ? '<p style="text-align: center; font-size: 18px;">Congratulations on the win!</p>' : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/contests/sample/leaderboard" style="background: ${isWinner ? '#059669' : '#7c3aed'}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Leaderboard</a>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 10px 0;">
      <a href="${APP_URL}" style="color: #6b7280; text-decoration: none;">Shugsy</a> - Box Office Fantasy
    </p>
    <p style="margin: 0;">
      <a href="${SAMPLE_DATA.unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from results</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

function newContestTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contest Available</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #7c3aed; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Contest Available!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="margin-top: 0;">Hey @${SAMPLE_DATA.username},</p>

    <p>A new contest is ready for you!</p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="margin: 0 0 8px 0; font-size: 18px;">${SAMPLE_DATA.contestName}</h2>
      <p style="margin: 0; color: #6b7280;">Jan 24 - Jan 26, 2025</p>
      <p style="margin: 12px 0 0 0; font-size: 14px;"><strong>8 movies</strong> to choose from</p>
    </div>

    <p>Build your lineup now!</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/contests/sample" style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Enter Contest</a>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 10px 0;">
      <a href="${APP_URL}" style="color: #6b7280; text-decoration: none;">Shugsy</a> - Box Office Fantasy
    </p>
    <p style="margin: 0;">
      <a href="${SAMPLE_DATA.unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from announcements</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// Server Actions
// ============================================================================

export async function getEmailPreview(
  emailType: 'lock_reminder' | 'contest_results' | 'new_contest'
): Promise<string> {
  await checkAdminAccess();

  switch (emailType) {
    case 'lock_reminder':
      return lockReminderTemplate();
    case 'contest_results':
      return contestResultsTemplate(false);
    case 'new_contest':
      return newContestTemplate();
    default:
      throw new Error('Invalid email type');
  }
}

export async function sendTestEmail(
  emailType: 'lock_reminder' | 'contest_results' | 'new_contest',
  toEmail: string
): Promise<{ success: boolean; error?: string }> {
  await checkAdminAccess();

  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  let html: string;
  let subject: string;

  switch (emailType) {
    case 'lock_reminder':
      html = lockReminderTemplate();
      subject = `[TEST] This weekend's contest locks in 3 hours`;
      break;
    case 'contest_results':
      html = contestResultsTemplate(false);
      subject = `[TEST] Your results for this weekend's contest`;
      break;
    case 'new_contest':
      html = newContestTemplate();
      subject = `[TEST] New contest: ${SAMPLE_DATA.contestName}`;
      break;
    default:
      return { success: false, error: 'Invalid email type' };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
