// ============================================================================
// Privacy Policy Page
// ============================================================================

import { Header } from '@/components/header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Shugsy, the box office fantasy sports game. Learn how we collect, use, and protect your information.',
  alternates: {
    canonical: 'https://www.shugsy.com/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <article className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: January 2025</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Shugsy ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, and safeguard your information when you use our box office
                fantasy sports game.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We collect the following types of information:
              </p>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Account Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Email address (required for account creation and authentication)</li>
                <li>Username (optional display name)</li>
              </ul>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Usage Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Contest entries and lineup selections</li>
                <li>Scores and rankings</li>
                <li>Contest participation history</li>
              </ul>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Device and browser information</li>
                <li>IP address</li>
                <li>Pages visited and features used</li>
                <li>Date and time of visits</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Create and manage your account</li>
                <li>Process contest entries and calculate scores</li>
                <li>Display leaderboards and rankings</li>
                <li>Send authentication emails (magic links)</li>
                <li>Communicate important updates about the Service</li>
                <li>Improve and optimize the Service</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Information Sharing</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We do not sell your personal information. We may share information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Public Leaderboards:</strong> Your username and scores may be displayed publicly on contest leaderboards</li>
                <li><strong>Service Providers:</strong> We use third-party services (such as Supabase for authentication and database hosting, and Vercel for website hosting) that may process your data on our behalf</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Analytics</h2>
              <p className="text-gray-700 leading-relaxed">
                We use Google Analytics to understand how visitors interact with our website. Google Analytics
                collects information such as how often users visit the site, what pages they visit, and what
                other sites they used prior to coming to our site. We use this information to improve our
                Service. Google's ability to use and share information collected by Google Analytics is
                restricted by the{' '}
                <a
                  href="https://www.google.com/analytics/terms/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Google Analytics Terms of Service
                </a>{' '}
                and the{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Google Privacy Policy
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies and similar technologies to maintain your session, remember your preferences,
                and analyze site usage. You can control cookies through your browser settings, but disabling
                cookies may affect functionality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate security measures to protect your information. However, no method of
                transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your account information and contest history for as long as your account is active
                or as needed to provide the Service. You may request deletion of your account by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Object to processing of your information</li>
                <li>Request data portability</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                To exercise these rights, please contact us at the email address below.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                The Service is not intended for children under 13. We do not knowingly collect personal
                information from children under 13. If you believe we have collected information from a
                child under 13, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by
                posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us at{' '}
                <a href="mailto:team@shugsy.com" className="text-teal-600 hover:text-teal-700 hover:underline">
                  team@shugsy.com
                </a>.
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
