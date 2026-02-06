import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  return (
    <Card className="h-full flex flex-col items-center justify-center text-center p-8">
      <MessageSquare className="h-16 w-16 text-muted-foreground" />
      <h2 className="mt-6 text-xl font-semibold">Select a conversation</h2>
      <p className="mt-2 text-muted-foreground">
        Choose from your existing conversations on the left, or start a new one by contacting a seller on a listing page.
      </p>
    </Card>
  );
}
