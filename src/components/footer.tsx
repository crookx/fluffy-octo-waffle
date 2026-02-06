import Link from 'next/link';
import { LandPlot } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-secondary">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col items-start">
             <Link href="/" className="flex items-center space-x-2 mb-4">
                <LandPlot className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Kenya Land Trust</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Building a transparent and trustworthy land market for all Kenyans.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Our Mission</h3>
            <p className="text-muted-foreground text-sm">
                We believe in the power of clear, verifiable information. Our platform provides a structured review process to help you make informed decisions when buying or selling land.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal & Contact</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/trust" className="text-muted-foreground hover:text-primary">Trust &amp; Verification</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Contact Us</Link></li>
              <li><Link href="/report" className="text-muted-foreground hover:text-primary">Report a Listing</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Kenya Land Trust. All rights reserved.</p>
            <p className="mt-2">
              Kenya Land Trust is an independent marketplace and is not affiliated with the Government of Kenya.
            </p>
            <p className="mt-2">
              Disclaimer: Kenya Land Trust provides an approval status based on submitted documents but does not constitute a legal guarantee of title. Buyers are advised to conduct their own due diligence.
            </p>
        </div>
      </div>
    </footer>
  );
}
