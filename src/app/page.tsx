import { BuyerHomePage } from '@/components/buyer/buyer-home-page';
import { BuyerHeader } from '@/components/buyer/buyer-header';
import { BuyerFooter } from '@/components/buyer/buyer-footer';

export default function Page() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <BuyerHeader />
      <main id="main-content" className="flex-1 w-full">
        <BuyerHomePage />
      </main>
      <BuyerFooter />
    </div>
  );
}
