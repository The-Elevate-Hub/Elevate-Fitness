export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-serif font-bold mb-8 text-foreground">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: December 8, 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">1. Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Elevate Fitness, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">2. Use License</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Permission is granted to temporarily download one copy of the materials (digital products) on Elevate Fitness for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or other proprietary notations</li>
              <li>Transfer the materials to another person or mirror the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">3. Digital Products</h2>
            <p className="text-muted-foreground leading-relaxed">
              All digital products purchased from Elevate Fitness are for personal use only. You receive a lifetime license to access and use the purchased content. Products are delivered digitally upon successful payment completion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">4. Payment and Refunds</h2>
            <p className="text-muted-foreground leading-relaxed">
              All payments are processed securely through Stripe. Due to the nature of digital products, all sales are final. No refunds will be issued once access has been granted to the purchased content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">5. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities that occur under your account. We reserve the right to refuse service, terminate accounts, or remove or edit content at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">6. Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The materials on Elevate Fitness are provided on an as is basis. Elevate Fitness makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">7. Health and Fitness Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The content provided by Elevate Fitness is for informational and educational purposes only. Always consult with a qualified healthcare professional before beginning any fitness program. Elevate Fitness is not responsible for any injuries or health issues that may result from following our programs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">8. Limitations</h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall Elevate Fitness or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use our materials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">9. Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              Elevate Fitness may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">10. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at elevate871@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}