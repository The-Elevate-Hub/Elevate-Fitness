export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-serif font-bold mb-8 text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: December 8, 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Name and email address when you create an account</li>
              <li>Payment information processed through Stripe</li>
              <li>Communications you send to us</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends, usage, and activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">3. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell, trade, or otherwise transfer your personal information to third parties. We may share your information with service providers who assist us in operating our website and conducting our business, such as payment processors (Stripe) and email service providers (Resend).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">4. Payment Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              All payment transactions are processed through Stripe. We do not store your complete credit card information on our servers. Stripe's privacy policy governs the collection and processing of your payment information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">5. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Request transfer of your information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">8. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at support@elevate-fitness.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}