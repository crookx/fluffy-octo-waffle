import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-stone dark:prose-invert max-w-none space-y-4">
          <section>
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, create or modify your profile, upload listing information and evidence documents, or otherwise communicate with us. This information may include your name, email, phone number, and any files you upload.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">2. How We Use Information</h2>
            <p>
              We may use the information we collect to provide, maintain, and improve our services, including to process transactions, develop new features, provide customer support, and authenticate users. We also use the content of uploaded documents to provide AI-powered analysis and summaries as part of our platform's features.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">3. AI Processing</h2>
            <p>
              When you upload listing materials, we may process them with AI systems to generate summaries, suggest trust badges, and identify potential risks. These outputs are advisory and are not used as a sole basis for legal or financial decisions.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">4. Information Sharing</h2>
            <p>
             We do not share your private information with third parties except as necessary to provide our services (such as with our cloud and AI service providers), to comply with the law, or to protect our rights. Publicly visible information on an approved listing, such as the property details and seller's name, will be accessible to visitors.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">5. Data Security</h2>
            <p>
             We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
