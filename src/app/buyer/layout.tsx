import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';
import { BuyerHeader } from '@/components/buyer/buyer-header';
import { BuyerFooter } from '@/components/buyer/buyer-footer';

export const metadata: Metadata = {
  title: 'Kenya Land Trust - Buyer Dashboard',
  description: 'Manage your saved properties, searches, and messages.',
};

/**
 * Layout for dedicated buyer routes like /buyer/dashboard
 */
export default function BuyerSectionLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <BuyerHeader />
      <main className="flex-1 w-full">{children}</main>
      <BuyerFooter />
    </div>
  );
}
