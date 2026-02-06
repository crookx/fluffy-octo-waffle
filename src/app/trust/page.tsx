import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TrustVerificationPage() {
  return (
    <div className="container mx-auto max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Trust &amp; Verification</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-stone dark:prose-invert max-w-none space-y-4">
          <section>
            <h2 className="text-xl font-semibold">How listings are reviewed</h2>
            <p>
              Sellers submit property details and supporting documents. Our team reviews the information provided
              and assigns a listing status. Approval indicates a completed review of submitted materials, but it
              is not a legal guarantee of title or ownership.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Trust badges</h2>
            <p>
              Trust badges (Gold, Silver, Bronze) reflect the completeness and consistency of documents submitted
              by the seller. Badges help compare listings but do not replace independent verification.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">AI-assisted checks</h2>
            <p>
              We use AI tools to summarize documents, suggest badges, and flag potentially suspicious patterns.
              AI outputs are advisory and may be inaccurate. Final decisions may include human review.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Location accuracy</h2>
            <p>
              Some listing maps show approximate locations when exact coordinates are not provided. Always verify
              boundaries and location details in person and through official records before any transaction.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Your responsibility</h2>
            <p>
              Kenya Land Trust is an independent marketplace. Buyers and sellers remain responsible for due
              diligence, legal review, and compliance with applicable laws and regulations.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
