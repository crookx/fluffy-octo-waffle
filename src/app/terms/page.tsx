import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-stone dark:prose-invert max-w-none space-y-4">
          <section>
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p>
              Welcome to Kenya Land Trust. These are the terms and conditions governing your access to and use of the website Kenya Land Trust and its related sub-domains, sites, services, and tools. By using the Site, you hereby accept these terms and conditions and represent that you agree to comply with these terms and conditions.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">2. User Responsibilities</h2>
            <p>
              You are responsible for your use of the service and for any content you provide, including compliance with applicable laws, rules, and regulations. You should only provide content that you are comfortable sharing with others. Sellers are responsible for the accuracy and legality of the information and documents they upload for their listings.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">3. Disclaimers and Limitation of Liability</h2>
            <p>
              The services are provided "as-is." Kenya Land Trust makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties. While we provide a verification and approval process, this does not constitute a legal guarantee of title or the authenticity of a listing. Buyers are strongly advised to conduct their own independent due diligence before entering into any transaction.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">4. Use of AI-Assisted Tools</h2>
            <p>
              We use AI-assisted tools to summarize documents, suggest trust badges, and detect suspicious patterns. These tools provide advisory insights and may contain errors. Final review decisions may still include human judgment, and you should not treat AI outputs as legal or professional advice.
            </p>
          </section>
           <section>
            <h2 className="text-xl font-semibold">5. Governing Law</h2>
            <p>
             These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of Kenya.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
