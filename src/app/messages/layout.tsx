import { ConversationsList } from '@/components/chat/conversations-list';
import { Card, CardContent } from '@/components/ui/card';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';

async function getAuthenticatedUser() {
    const sessionCookie = cookies().get('__session')?.value;
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
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 h-[calc(100vh-150px)]">
        <div className="md:col-span-1 h-full">
            <Card className="h-full">
                <CardContent className="p-0 h-full">
                   <ConversationsList />
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-3 h-full">
            {children}
        </div>
      </div>
    </div>
  );
}
