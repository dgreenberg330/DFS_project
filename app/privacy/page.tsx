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
          <p className="text-sm text-gray-500 mb-8">Effective Date: January 17, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p>
                This Privacy Policy describes how Shugsy ("we," "us," or "our") collects, uses, and discloses
                your personal information when you use our software as a service (the "Service").
              </p>
              <p>
                We are committed to protecting your personal information and your right to privacy. When you
                visit our software as a service and use our products, you trust us with your personal information.
                We take your privacy very seriously. In this Privacy Policy, we seek to explain to you in the
                clearest way possible what information we collect, how we use it, and what rights you have in
                relation to it.
              </p>
              <p>
                This Privacy Policy applies to all information collected through our software as a service, as
                well as any related services, sales, marketing, or events.
              </p>
              <p>
                Please read this Privacy Policy carefully as it will help you understand what we do with the
                information we collect.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Definitions</h2>
              <p className="mb-3">
                To help explain things as clearly as possible in this Privacy Policy, every time any of these
                terms are referenced, they are strictly defined as:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cookie:</strong> a small file placed on your device to enable certain features and functionality.</li>
                <li><strong>Company:</strong> when this policy mentions "Company," "we," "us," or "our," it refers to Shugsy.</li>
                <li><strong>Country:</strong> where Shugsy or the owners/founders of Shugsy are based, in this case United States.</li>
                <li><strong>Customer:</strong> refers to the company, organization, or person that signs up to use the Shugsy Service.</li>
                <li><strong>Device:</strong> any internet-connected device such as a phone, tablet, computer, or any other device that can be used to visit Shugsy and use the services.</li>
                <li><strong>Personal Data:</strong> any information that directly, indirectly, or in connection with other information allows for the identification of a natural person.</li>
                <li><strong>Service:</strong> refers to the software as a service provided by Shugsy as described in the relative terms and on this platform.</li>
                <li><strong>Third-party service:</strong> refers to advertisers, contest sponsors, promotional and marketing partners, and others who provide our content or whose products or services we think may interest you.</li>
                <li><strong>Website:</strong> Shugsy's site, which can be accessed via{' '}
                  <a href="https://www.shugsy.com" className="text-teal-600 hover:text-teal-700 hover:underline">https://www.shugsy.com</a>.
                </li>
                <li><strong>You:</strong> a person or entity that is registered with Shugsy to use the Services.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information We Collect</h2>
              <p>
                We collect several different types of information for various purposes to provide and improve
                our Service to you.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">3.1 Personal Data</h3>
              <p className="mb-2">
                While using our Service, we may ask you to provide us with certain personally identifiable
                information that can be used to contact or identify you. Personally identifiable information
                may include, but is not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email address</li>
                <li>Username</li>
                <li>Cookies and Usage Data</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">3.2 Usage Data</h3>
              <p>
                We may also collect information about how the Service is accessed and used ("Usage Data"). This
                Usage Data may include information such as your computer's Internet Protocol address (e.g. IP
                address), browser type, browser version, the pages of our Service that you visit, the time and
                date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">3.3 Tracking Technologies and Cookies</h3>
              <p>
                We use cookies and similar tracking technologies to track the activity on our Service and hold
                certain information.
              </p>
              <p>
                Cookies are files with a small amount of data which may include an anonymous unique identifier.
                Cookies are sent to your browser from a website and stored on your device. Tracking technologies
                also used are beacons, tags, and scripts to collect and track information and to improve and
                analyze our Service.
              </p>
              <p>
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                However, if you do not accept cookies, you may not be able to use some portions of our Service.
              </p>
              <p className="mb-2">Examples of Cookies we use:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Session Cookies:</strong> We use Session Cookies to operate our Service.</li>
                <li><strong>Preference Cookies:</strong> We use Preference Cookies to remember your preferences and various settings.</li>
                <li><strong>Security Cookies:</strong> We use Security Cookies for security purposes.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. How We Use Your Information</h2>
              <p className="mb-2">Shugsy uses the collected data for various purposes:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information so that we can improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address technical issues</li>
                <li>To fulfill any other purpose for which you provide it</li>
                <li>To provide you with news, special offers and general information about other goods, services and events which we offer that are similar to those that you have already purchased or enquired about unless you have opted not to receive such information</li>
                <li>In any other way we may describe when you provide the information</li>
                <li>For any other purpose with your consent</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Retention of Your Personal Data</h2>
              <p>
                Shugsy will retain your Personal Data only for as long as is necessary for the purposes set out
                in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to
                comply with our legal obligations (for example, if we are required to retain your data to comply
                with applicable laws), resolve disputes, and enforce our legal agreements and policies.
              </p>
              <p className="mb-2">We retain personal data according to the following schedules:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Account information:</strong> Duration of account plus 90 days after account closure request</li>
                <li><strong>Contest entries and scores:</strong> 2 years after contest resolution for audit and dispute purposes</li>
                <li><strong>Usage data:</strong> 24 months, then anonymized for analytics</li>
                <li><strong>Email communications:</strong> Duration of account plus 30 days</li>
              </ul>
              <p>
                Shugsy will also retain Usage Data for internal analysis purposes. Usage Data is generally
                retained for a shorter period of time, except when this data is used to strengthen the security
                or to improve the functionality of our Service, or we are legally obligated to retain this data
                for longer time periods.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Transfer of Your Personal Data</h2>
              <p>
                Your information, including Personal Data, may be transferred to — and maintained on — computers
                located outside of your state, province, country or other governmental jurisdiction where the
                data protection laws may differ from those of your jurisdiction.
              </p>
              <p>
                If you are located outside United States and choose to provide information to us, please note
                that we transfer the data, including Personal Data, to United States and process it there.
              </p>
              <p>
                Your consent to this Privacy Policy followed by your submission of such information represents
                your agreement to that transfer.
              </p>
              <p>
                Shugsy will take all steps reasonably necessary to ensure that your data is treated securely and
                in accordance with this Privacy Policy and no transfer of your Personal Data will take place to
                an organization or a country unless there are adequate controls in place including the security
                of your data and other personal information.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Disclosure of Your Personal Data</h2>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Business Transactions</h3>
              <p>
                If Shugsy is involved in a merger, acquisition or asset sale, your Personal Data may be
                transferred. We will provide notice before your Personal Data is transferred and becomes
                subject to a different Privacy Policy.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Disclosure for Law Enforcement</h3>
              <p>
                Under certain circumstances, Shugsy may be required to disclose your Personal Data if required
                to do so by law or in response to valid requests by public authorities (e.g. a court or a
                government agency).
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Legal Requirements</h3>
              <p className="mb-2">
                Shugsy may disclose your Personal Data in the good faith belief that such action is necessary to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Comply with a legal obligation</li>
                <li>Protect and defend the rights or property of Shugsy</li>
                <li>Prevent or investigate possible wrongdoing in connection with the Service</li>
                <li>Protect the personal safety of users of the Service or the public</li>
                <li>Protect against legal liability</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Third-Party Disclosure</h2>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">8.1 Analytics</h3>
              <p>We may use third-party Service Providers to monitor and analyze the use of our Service.</p>
              <p>
                <strong>Google Analytics:</strong> Google Analytics is a web analytics service offered by Google
                that tracks and reports website traffic. Google uses the data collected to track and monitor the
                use of our Service. This data is shared with other Google services. Google may use the collected
                data to contextualize and personalize the ads of its own advertising network. You can opt-out of
                having made your activity on the Service available to Google Analytics by installing the Google
                Analytics opt-out browser add-on. The add-on prevents the Google Analytics JavaScript from sharing
                information with Google Analytics about visits activity. For more information on the privacy
                practices of Google, please visit the Google Privacy & Terms web page:{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-700 hover:underline"
                >
                  https://policies.google.com/privacy
                </a>
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">8.2 Hosting and Infrastructure</h3>
              <p className="mb-2">We use third-party service providers to host our Service and store your data:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Supabase:</strong> We use Supabase for authentication and database services. Their Privacy
                  Policy can be viewed at{' '}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    https://supabase.com/privacy
                  </a>
                </li>
                <li>
                  <strong>Vercel:</strong> We use Vercel for website hosting. Their Privacy Policy can be viewed at{' '}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    https://vercel.com/legal/privacy-policy
                  </a>
                </li>
              </ul>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Security of Your Personal Data</h2>
              <p>
                The security of your Personal Data is important to us, but remember that no method of transmission
                over the Internet, or method of electronic storage is 100% secure. While we strive to use
                commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Data Breach Notification</h2>
              <p className="mb-2">
                In the event of a data breach affecting your personal information, we will:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Notify affected California residents within 30 days of discovery</li>
                <li>Notify affected Delaware residents within 60 days of discovery</li>
                <li>Notify the California Attorney General within 15 days if 500 or more California residents are affected</li>
                <li>Provide information about the nature of the breach, categories of data affected, and steps you can take to protect yourself</li>
              </ul>
              <p>
                We maintain incident response procedures to detect, respond to, and recover from potential security
                incidents affecting your personal data.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Children's Privacy</h2>
              <p>
                Our Service is intended for users who are at least 18 years old. We do not knowingly collect
                personally identifiable information from anyone under the age of 18. If you are a parent or
                guardian and you are aware that your child has provided us with Personal Data, please contact us.
                If we become aware that we have collected Personal Data from anyone under the age of 18, we take
                steps to remove that information from our servers and terminate the associated account.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Your Data Protection Rights</h2>
              <p>
                Depending on your location and applicable laws, you may have certain rights regarding your personal
                information, including rights to access, correct, delete, or restrict use of your information. We
                honor these rights regardless of your location and are committed to providing reasonable access to
                the information that you have shared with us.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">12.1 General Data Access & Deletion Rights</h3>
              <p className="mb-2">Regardless of your location, you can make the following requests regarding your personal data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Access Your Data:</strong> You can request a copy of the personal information we have
                  about you. We will provide this information in a structured, commonly used, and machine-readable format.
                </li>
                <li>
                  <strong>Delete Your Data:</strong> You can request that we delete your personal information from
                  our systems. We will comply with this request unless there is a legal requirement for us to keep
                  certain information.
                </li>
              </ul>
              <p>
                To submit a data access or deletion request, please contact us using the contact information
                provided at the end of this Privacy Policy. We will respond to your request within 30 days. We
                may need to verify your identity before processing your request.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">12.2 CCPA Privacy Rights (California Residents)</h3>
              <p className="mb-2">
                If you are a California resident, you are entitled to learn what data we collect about you, ask to
                delete your data and not to sell (share) it. To exercise your data protection rights, you can make
                certain requests and ask us:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>What personal information we have about you.</strong> If you make this request, we will return to you:
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>The categories of personal information we have collected about you</li>
                    <li>The categories of sources from which we collect your personal information</li>
                    <li>The business or commercial purpose for collecting or selling your personal information</li>
                    <li>The categories of third parties with whom we share personal information</li>
                    <li>The specific pieces of personal information we have collected about you</li>
                  </ul>
                </li>
                <li>
                  <strong>To delete your personal information.</strong> If you make this request, we will delete
                  the personal information we hold about you as of the date of your request from our records and
                  direct any service providers to do the same. In some cases, deletion may be accomplished through
                  de-identification of the information.
                </li>
                <li>
                  <strong>To stop selling your personal information.</strong> We don't sell or rent your personal
                  information to any third parties for any purpose. We do not sell your personal information for
                  monetary consideration. However, under some state laws, sharing your data through certain targeted
                  advertisements may be considered a "sale" of information. You are the only owner of your Personal
                  Data and can request disclosure or deletion at any time.
                </li>
              </ul>
              <p>
                We will respond to verified requests within 45 days as required by the CCPA. If we need more time,
                we will inform you of the reason and extension period in writing.
              </p>
              <p>
                Please note, if you ask us to delete or stop selling your data, it may impact your experience with
                us, and you may not be able to participate in certain programs or membership services which require
                the usage of your personal information to function. But in no circumstances, we will discriminate
                against you for exercising your rights.
              </p>
              <p>
                To exercise your California data protection rights described above, please send your request(s) by
                email:{' '}
                <a href="mailto:team@shugsy.com" className="text-teal-600 hover:text-teal-700 hover:underline">
                  team@shugsy.com
                </a>
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">12.3 Global Privacy Control (GPC)</h3>
              <p>
                We honor Global Privacy Control (GPC) signals. If your browser sends a GPC signal, we will treat
                it as a valid request to opt out of the sale or sharing of your personal information as defined
                under applicable privacy laws, including the CCPA.
              </p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Service Providers</h2>
              <p>
                We may employ third-party companies and individuals to facilitate our Service ("Service Providers"),
                to provide the Service on our behalf, to perform Service-related services or to assist us in
                analyzing how our Service is used.
              </p>
              <p>
                These third parties have access to your Personal Data only to perform these tasks on our behalf and
                are obligated not to disclose or use it for any other purpose.
              </p>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Links to Other Sites</h2>
              <p>
                Our Service may contain links to other sites that are not operated by us. If you click on a third
                party link, you will be directed to that third party's site. We strongly advise you to review the
                Privacy Policy of every site you visit.
              </p>
              <p>
                We have no control over and assume no responsibility for the content, privacy policies or practices
                of any third party sites or services.
              </p>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting
                the new Privacy Policy on this page.
              </p>
              <p>
                We will let you know via email and/or a prominent notice on our Service, prior to the change
                becoming effective and update the "effective date" at the top of this Privacy Policy.
              </p>
              <p>
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy
                Policy are effective when they are posted on this page.
              </p>
            </section>

            {/* Section 16 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">16. Contact Us</h2>
              <p className="mb-2">If you have any questions about this Privacy Policy, please contact us:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  By email:{' '}
                  <a href="mailto:team@shugsy.com" className="text-teal-600 hover:text-teal-700 hover:underline">
                    team@shugsy.com
                  </a>
                </li>
                <li>
                  By visiting this page on our website:{' '}
                  <a href="https://www.shugsy.com/privacy" className="text-teal-600 hover:text-teal-700 hover:underline">
                    https://www.shugsy.com/privacy
                  </a>
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
