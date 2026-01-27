// ============================================================================
// Admin: Email Templates Preview & Test
// ============================================================================

import { requireAdmin } from '@/lib/admin';
import { EmailPreviewClient } from './email-preview-client';

export default async function EmailPreviewPage() {
  await requireAdmin();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
        <p className="text-sm text-gray-600 mt-1">
          Preview and send test emails
        </p>
      </div>

      <EmailPreviewClient />
    </div>
  );
}
