// ============================================================================
// Terms of Service Page
// ============================================================================

import { Header } from '@/components/header';
import Link from 'next/link';
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
          <p className="text-sm text-gray-500 mb-8">Last Updated: January 17, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p>
                These Terms of Service ("Terms") govern your access to and use of the Shugsy software service,
                including any associated websites, networks, applications, and other services provided by Shugsy
                (collectively, the "Service"). These Terms constitute a legally binding agreement between you and
                Shugsy ("we," "us," or "our"). By accessing or using our Service, you acknowledge that you have
                read, understood, and agree to be bound by these Terms.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Definitions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>"User," "you," and "your"</strong> refer to the individual or entity accessing or using the Service.</li>
                <li><strong>"Content"</strong> refers to any text, images, videos, audio, or other material that appears on or through the Service.</li>
                <li><strong>"User Data"</strong> refers to any data, information, or material that you upload, input, or otherwise provide to the Service.</li>
                <li><strong>"Contest"</strong> refers to a weekly box office fantasy competition hosted on the Service.</li>
                <li><strong>"Lineup"</strong> refers to your selection of movies for a Contest.</li>
                <li><strong>"Intellectual Property Rights"</strong> means all patent rights, copyright rights, moral rights, rights of publicity, trademark rights, trade dress and service mark rights, goodwill, trade secret rights, and other intellectual property rights.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Acceptance of Terms</h2>
              <p>
                By accessing or using our Service, you agree to be bound by these Terms and our{' '}
                <Link href="/privacy" className="text-teal-600 hover:text-teal-700 hover:underline">
                  Privacy Policy
                </Link>, which is incorporated by reference. If you are using our Service on behalf of an
                organization, you represent and warrant that you have the authority to bind that organization
                to these Terms. If you do not agree to these Terms, you may not access or use our Service.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will provide notice of significant
                changes by posting a prominent notice on our Service or by sending you an email. Your continued
                use of our Service after any such changes constitutes your acceptance of the revised Terms. If
                you do not agree to the revised Terms, you must stop using our Service.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Eligibility</h2>
              <p>
                To use our Service, you must be at least 18 years old or the age of legal majority in your
                jurisdiction, whichever is greater. By using our Service, you represent and warrant that you
                meet the eligibility requirements. If you are using the Service on behalf of an organization,
                you represent and warrant that the organization agrees to be bound by these Terms.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Service Description</h2>
              <p>
                The Shugsy Service is a free fantasy sports game based on movie box office performance. Users
                create lineups of movies from a weekly slate and earn points based on domestic opening weekend
                gross. The Service allows users to compete on leaderboards and track their performance over time.
                The Service is provided for entertainment purposes only and does not involve real money prizes
                or gambling.
              </p>
              <p>
                The Service may not be available in all states or jurisdictions. You are responsible for
                determining whether your use of the Service is lawful in your jurisdiction.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contest Rules</h2>
              <p className="mb-3">By entering a Contest, you agree to the following rules:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>One entry per user per Contest</li>
                <li>Lineups must include 2-4 movies from the weekly slate</li>
                <li>Lineups must stay within the $50,000 salary cap</li>
                <li>Lineups must be submitted before the Contest lock time (typically Thursday 8PM ET)</li>
                <li>Lineups cannot be modified after the lock time</li>
                <li>Scoring is based on official domestic opening weekend box office figures (Friday-Sunday) from Box Office Mojo</li>
                <li>Points are awarded at a rate of 1 point per $1 million in box office gross</li>
                <li>All decisions regarding scoring and rankings are final</li>
              </ul>
              <p className="mt-3">
                We reserve the right to disqualify any entry that we believe violates these rules or was
                submitted in bad faith.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Service Availability</h2>
              <p>
                We will make reasonable efforts to keep our Service operational. However, we do not guarantee
                continuous, uninterrupted access to our Service, and operation of our Service may be interfered
                with by numerous factors outside our control.
              </p>
              <p>
                We reserve the right to suspend access to the Service, in whole or in part, for maintenance or
                upgrades or to address security concerns, with or without notice.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. User Accounts</h2>
              <p className="mb-3">You must create an account to access the Service. You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Providing accurate, current, and complete information</li>
                <li>Maintaining the confidentiality of your account</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="mt-3">
                We reserve the right to suspend or terminate your account at our discretion if we believe you
                have violated these Terms or if we believe your account may pose a risk to our Service or other users.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Acceptable Use</h2>
              <p className="mb-3">
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You shall not:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Create multiple accounts to gain an unfair advantage in Contests</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe the rights of others, including intellectual property rights</li>
                <li>Attempt to breach any security or authentication measures</li>
                <li>Transmit any viruses, malware, or other harmful code</li>
                <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                <li>Collect or harvest any information from the Service, including user accounts or data</li>
                <li>Impersonate any person or entity or falsely state or misrepresent your affiliation</li>
                <li>Use automated scripts, bots, or other automated means to interact with the Service</li>
                <li>Attempt to manipulate Contest results or rankings</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. User Data</h2>
              <p>
                You retain all ownership rights to your User Data. By uploading, inputting, or otherwise providing
                User Data to the Service, you grant us a worldwide, non-exclusive, royalty-free license to use,
                reproduce, store, modify, display, and distribute your User Data solely as necessary to provide
                the Service to you.
              </p>
              <p>
                We will not access your User Data except to provide the Service to you, to prevent or address
                technical or security issues, to respond to support requests, as required by law, or as explicitly
                permitted by you.
              </p>
              <p>
                You are solely responsible for the accuracy, quality, integrity, legality, reliability, and
                appropriateness of your User Data.
              </p>
              <p>
                The operator maintains commercially reasonable security measures but cannot guarantee absolute
                security. By using the Service, you acknowledge the inherent risks of internet-based data storage.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Privacy</h2>
              <p>
                Our{' '}
                <Link href="/privacy" className="text-teal-600 hover:text-teal-700 hover:underline">
                  Privacy Policy
                </Link>{' '}
                describes our practices regarding the information we collect from you. By using the Service, you
                consent to our collection and use of your information as described in the Privacy Policy.
              </p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Intellectual Property</h2>
              <p>
                All content provided by Shugsy, including but not limited to the Service, website, text, graphics,
                logos, icons, images, audio clips, digital downloads, data compilations, and software, is the
                property of Shugsy or its content suppliers and is protected by international copyright, trademark,
                and other intellectual property laws.
              </p>
              <p>
                Movie titles, box office data, and related information are used for informational and entertainment
                purposes. All movie-related intellectual property remains the property of their respective owners.
              </p>
              <p>
                We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service for
                your personal use in accordance with these Terms. This license does not include the right to modify,
                copy, distribute, sell, or commercially exploit the Service or any content therein.
              </p>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Feedback</h2>
              <p>
                We welcome feedback, comments, and suggestions for improvement of the Service ("Feedback"). You
                grant us a perpetual, irrevocable, non-exclusive, royalty-free, transferable, worldwide license
                to use, copy, modify, create derivative works based on, distribute, and otherwise exploit such
                Feedback without any attribution or compensation to you.
              </p>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Third-Party Links</h2>
              <p>
                The Service may contain links to third-party websites or services. When you use third-party
                services, their terms and privacy policies govern your use of those services.
              </p>
              <p>
                We do not endorse and are not responsible or liable for the behavior, features, or content of any
                third-party service or for any transaction you may enter into with the provider of such services.
              </p>
            </section>

            {/* Section 16 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">16. Disclaimer of Warranties</h2>
              <p className="uppercase">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED "AS IS" AND "AS
                AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED
                TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
                NON-INFRINGEMENT. SHUGSY DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE,
                OR SECURE, OR THAT ANY DEFECTS WILL BE CORRECTED, OR THAT YOUR USE OF THE SERVICE WILL MEET
                YOUR REQUIREMENTS OR EXPECTATIONS.
              </p>
            </section>

            {/* Section 17 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">17. Limitation of Liability</h2>
              <p className="uppercase">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL SHUGSY BE LIABLE FOR ANY
                SPECIAL, INCIDENTAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER, INCLUDING BUT NOT LIMITED TO
                DAMAGES FOR LOSS OF PROFITS, LOSS OF DATA, BUSINESS INTERRUPTION, OR ANY OTHER COMMERCIAL DAMAGES
                OR LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICE. SOME
                JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF INCIDENTAL OR CONSEQUENTIAL DAMAGES,
                SO THE ABOVE LIMITATION MAY NOT APPLY TO YOU.
              </p>
              <p>
                Shugsy is operated as an unincorporated sole proprietorship. Limitations of liability in these
                Terms reflect the maximum extent permitted by law for individual operators, which may vary by
                jurisdiction. Nothing in these Terms limits liability for fraud, gross negligence, or intentional
                misconduct.
              </p>
            </section>

            {/* Section 18 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">18. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Shugsy, its officers, directors, employees,
                agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs,
                expenses, or fees (including reasonable attorneys' fees) that such parties may incur as a result
                of or arising from your violation of these Terms, your User Data, or your use of the Service.
              </p>
            </section>

            {/* Section 19 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">19. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of
                New York, United States, without regard to its conflict of law provisions. Our failure to enforce
                any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </section>

            {/* Section 20 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">20. Dispute Resolution</h2>
              <p>
                Any disputes arising from these Terms will first be attempted to be resolved informally by
                contacting us at{' '}
                <a href="mailto:team@shugsy.com" className="text-teal-600 hover:text-teal-700 hover:underline">
                  team@shugsy.com
                </a>. If we cannot resolve the dispute informally within 30 days, either party may pursue formal
                legal proceedings.
              </p>
              <p>
                Any formal legal proceedings shall be brought exclusively in the state or federal courts located
                in New York, and you consent to the personal jurisdiction of such courts.
              </p>
            </section>

            {/* Section 21 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">21. Termination</h2>
              <p className="mb-3">
                We reserve the right to suspend or terminate your access to our Service at our sole discretion,
                with or without notice, for conduct that we believe violates these Terms or is harmful to other
                users of our Service, us, or third parties, or for any other reason. Upon termination:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your license to use the Service will immediately cease</li>
                <li>You will lose access to any User Data stored in the Service</li>
                <li>We may delete your User Data in accordance with our data retention policies</li>
              </ul>
              <p className="mt-3">
                If you wish to terminate your account, you may do so by contacting us at{' '}
                <a href="mailto:team@shugsy.com" className="text-teal-600 hover:text-teal-700 hover:underline">
                  team@shugsy.com
                </a>.
              </p>
            </section>

            {/* Section 22 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">22. Entire Agreement</h2>
              <p>
                These Terms, including our Privacy Policy and any other agreements referenced herein, constitute
                the entire agreement between you and Shugsy regarding your use of our Service and supersede any
                prior agreements between you and Shugsy relating to your use of our Service.
              </p>
            </section>

            {/* Section 23 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">23. Waiver and Severability</h2>
              <p>
                The failure of Shugsy to enforce any right or provision of these Terms will not be deemed a waiver
                of such right or provision. If any provision of these Terms is found to be invalid or unenforceable,
                the remaining provisions will remain in full force and effect.
              </p>
            </section>

            {/* Section 24 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">24. Assignment</h2>
              <p>
                These Terms, and any rights and licenses granted hereunder, may not be transferred or assigned by
                you without the prior written consent of Shugsy, but may be assigned by Shugsy without restriction.
              </p>
            </section>

            {/* Section 25 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">25. Survival</h2>
              <p>
                All provisions of these Terms which by their nature should survive termination shall survive
                termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity,
                and limitations of liability.
              </p>
            </section>

            {/* Section 26 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">26. Force Majeure</h2>
              <p>
                Shugsy shall not be liable for any delay or failure to perform resulting from causes outside its
                reasonable control, including but not limited to acts of God, war, terrorism, riots, embargoes,
                acts of civil or military authorities, fire, floods, accidents, pandemics, epidemics, or disease.
              </p>
            </section>

            {/* Section 27 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">27. Contact Information</h2>
              <p className="mb-2">If you have any questions about these Terms, please contact us:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  By email:{' '}
                  <a href="mailto:team@shugsy.com" className="text-teal-600 hover:text-teal-700 hover:underline">
                    team@shugsy.com
                  </a>
                </li>
                <li>
                  By visiting this page on our website:{' '}
                  <Link href="/terms" className="text-teal-600 hover:text-teal-700 hover:underline">
                    https://www.shugsy.com/terms
                  </Link>
                </li>
                <li>By mail: 1207 Delaware Ave, Suite 3817, Wilmington, DE, 19806</li>
              </ul>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
