// ============================================================================
// Terms of Service Page
// ============================================================================

import { Header } from '@/components/header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Shugsy, the box office fantasy sports game. Read our terms and conditions for using the platform.',
  alternates: {
    canonical: 'https://www.shugsy.com/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <article className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: January 2025</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using Shugsy ("the Service"), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed">
                Shugsy is a free fantasy sports game based on movie box office performance. Users create lineups
                of movies and earn points based on domestic opening weekend gross. The Service is provided for
                entertainment purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Eligibility</h2>
              <p className="text-gray-700 leading-relaxed">
                You must be at least 13 years old to use the Service. By using Shugsy, you represent that you
                meet this age requirement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Accounts</h2>
              <p className="text-gray-700 leading-relaxed">
                To participate in contests, you must create an account using a valid email address. You are
                responsible for maintaining the confidentiality of your account and for all activities that
                occur under your account. You agree to provide accurate information and to update it as necessary.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Contest Rules</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                By entering a contest, you agree to the following rules:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>One entry per user per contest</li>
                <li>Lineups must be submitted before the contest lock time</li>
                <li>Lineups cannot be modified after the lock time</li>
                <li>Scoring is based on official domestic opening weekend box office figures</li>
                <li>All decisions regarding scoring and rankings are final</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Prohibited Conduct</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Create multiple accounts to gain an unfair advantage</li>
                <li>Use automated systems or bots to interact with the Service</li>
                <li>Attempt to manipulate contest results or rankings</li>
                <li>Interfere with the proper operation of the Service</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                The Service and its original content, features, and functionality are owned by Shugsy and are
                protected by copyright, trademark, and other intellectual property laws. Movie titles and
                related information are used for informational purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Disclaimer of Warranties</h2>
              <p className="text-gray-700 leading-relaxed">
                The Service is provided "as is" and "as available" without warranties of any kind, either
                express or implied. We do not guarantee that the Service will be uninterrupted, secure, or
                error-free.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                To the fullest extent permitted by law, Shugsy shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages resulting from your use of or inability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Modifications to Service</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify, suspend, or discontinue the Service at any time without notice.
                We may also update these Terms of Service from time to time. Continued use of the Service after
                any changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your account and access to the Service at our sole discretion,
                without notice, for conduct that we believe violates these Terms of Service or is harmful to
                other users or the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about these Terms of Service, please contact us at{' '}
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
