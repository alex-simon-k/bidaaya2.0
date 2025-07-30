import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms and Conditions | Bidaaya',
  description: 'Terms and Conditions for using the Bidaaya platform',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
            <p className="text-lg text-gray-600">Last updated: 30 July 2025</p>
          </div>

          {/* Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed mb-6">
                Welcome to Bidaaya, a web-based platform that connects students with project-based internships and opportunities. Please read these Terms and Conditions ("Terms") carefully before using the Bidaaya platform ("Platform", "Service", or "Website") operated by Bidaaya Ltd ("we", "us", or "our"). By accessing or using the Platform, you agree to be bound by these Terms.
              </p>
              
              <p className="text-gray-700 leading-relaxed mb-8">
                If you do not agree with any part of the Terms, you may not access or use the Platform.
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Eligibility</h2>
                <p className="text-gray-700 leading-relaxed">
                  To use Bidaaya, you must be at least 13 years old or the age of legal majority in your jurisdiction, whichever is higher. By using the Platform, you represent and warrant that you meet these eligibility requirements.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Account Registration and Authentication</h2>
                <p className="text-gray-700 leading-relaxed">
                  Bidaaya uses Google Authentication to verify user identities. By registering through your Google account, you grant us permission to access certain Google account information as governed by our <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</a>. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Data and Privacy</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  By creating a profile and using the Platform, you agree that:
                </p>
                <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2 mb-4">
                  <li>You will provide accurate and complete information.</li>
                  <li>Your data may be shared with partner employers or organizations as part of the recruitment and matching process.</li>
                  <li>Your data will not be shared with any third parties who are not registered and approved members of the Bidaaya ecosystem.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  We take your privacy seriously. For more details, refer to our <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</a>.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Use of the Platform</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Bidaaya is a tool to connect users (students or jobseekers) with companies or organizations offering projects or internship opportunities. Usage of the Platform includes but is not limited to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2 mb-4">
                  <li>Creating and managing user profiles</li>
                  <li>Receiving internship/project suggestions via algorithmic recommendations</li>
                  <li>Applying to opportunities</li>
                  <li>Participating in shortlisting and recruitment processes</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Using the Platform does not guarantee an internship or job placement.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Any official engagement (such as a guaranteed internship or paid contract) must be formalized separately by agreement between the user and the organization offering the opportunity.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. User Conduct</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You agree not to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2 mb-4">
                  <li>Use the Platform for any illegal or unauthorized purpose</li>
                  <li>Misrepresent your identity, qualifications, or affiliations</li>
                  <li>Interfere with the operation or security of the Platform</li>
                  <li>Copy, scrape, or resell any content or data on the Platform without express permission</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to suspend or terminate accounts that violate these rules.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Employer and Partner Responsibilities</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Organizations using the Platform to find and engage with students:
                </p>
                <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2 mb-4">
                  <li>Must treat all users fairly and lawfully</li>
                  <li>May contact and assess applicants through the Platform</li>
                  <li>Are solely responsible for any contracts, payments, or arrangements made with users outside the Platform</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  Bidaaya is not responsible for the behavior, communication, or performance of any employer or organization listed on the Platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
                <p className="text-gray-700 leading-relaxed">
                  All content, branding, and technology used on the Platform (excluding user-generated content) is the intellectual property of Bidaaya Ltd. Unauthorized use, duplication, or distribution of any materials is strictly prohibited.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  To the maximum extent permitted by law, Bidaaya Ltd shall not be liable for:
                </p>
                <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
                  <li>Any direct, indirect, or consequential loss or damage arising from the use of or inability to use the Platform</li>
                  <li>Any engagements, offers, contracts, or internships facilitated through the Platform</li>
                  <li>The accuracy or reliability of information submitted by users or employers</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to suspend or terminate your access to the Platform at any time, with or without cause, and without prior notice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications to the Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update or modify these Terms at any time. Continued use of the Platform after changes indicates acceptance of the new Terms. Users will be notified via email or platform alerts of material changes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
                <p className="text-gray-700 leading-relaxed">
                  These Terms shall be governed and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law principles.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms, please contact us at: <a href="mailto:legal@bidaaya.com" className="text-blue-600 hover:text-blue-700 underline">legal@bidaaya.com</a>
                </p>
              </section>

              <div className="border-t border-gray-200 pt-8 mt-12">
                <p className="text-gray-700 leading-relaxed font-medium">
                  By registering for and using the Bidaaya platform, you confirm that you have read, understood, and agreed to these Terms and Conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 