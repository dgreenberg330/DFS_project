// ============================================================================
// Email Preview Client Component
// ============================================================================

'use client';

import { useState } from 'react';
import { getEmailPreview, sendTestEmail } from './actions';

type EmailType = 'lock_reminder' | 'contest_results' | 'new_contest';

const EMAIL_TYPES: { value: EmailType; label: string }[] = [
  { value: 'lock_reminder', label: 'Lock Reminder' },
  { value: 'contest_results', label: 'Contest Results' },
  { value: 'new_contest', label: 'New Contest' },
];

export function EmailPreviewClient() {
  const [selectedType, setSelectedType] = useState<EmailType>('lock_reminder');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handlePreview() {
    setLoading(true);
    try {
      const html = await getEmailPreview(selectedType);
      setPreviewHtml(html);
    } catch (err) {
      console.error('Preview failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendTest() {
    if (!testEmail) return;

    setSendStatus(null);
    setLoading(true);
    try {
      const result = await sendTestEmail(selectedType, testEmail);
      if (result.success) {
        setSendStatus({ type: 'success', message: `Test email sent to ${testEmail}` });
      } else {
        setSendStatus({ type: 'error', message: result.error || 'Failed to send' });
      }
    } catch (err) {
      setSendStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to send' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as EmailType);
                setPreviewHtml(null);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {EMAIL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Loading...' : 'Preview'}
          </button>

          <div className="flex-1" />

          <div className="flex gap-2 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Email
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>
            <button
              onClick={handleSendTest}
              disabled={loading || !testEmail}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              Send Test
            </button>
          </div>
        </div>

        {sendStatus && (
          <div
            className={`mt-4 p-3 rounded-lg ${
              sendStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {sendStatus.message}
          </div>
        )}
      </div>

      {/* Preview */}
      {previewHtml && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="font-medium text-gray-900">Preview</h2>
          </div>
          <div className="p-6 bg-gray-100">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[600px] bg-white rounded-lg shadow-inner border-0"
              title="Email Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
