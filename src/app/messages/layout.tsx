import { ConversationsList } from '@/components/chat/conversations-list';
import { Card, CardContent } from '@/components/ui/card';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { SellerPage } from '@/components/seller/seller-page';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) return null;

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedToken;
    } catch(e) {
        return null;
    }
}


export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login?redirect=/messages');
  }

  return (
    <SellerPage
      title="Messages"
      description="Keep track of buyer conversations and respond quickly."
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-220px)]">
        <div className="lg:col-span-1 h-full">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <ConversationsList />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3 h-full">
          {children}
        </div>
      </div>
    </SellerPage>
  );
}
