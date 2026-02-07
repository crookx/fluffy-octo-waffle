'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SellerPage } from '@/components/seller/seller-page';
import { Settings } from 'lucide-react';

export default function SellerSettingsPage() {
  return (
    <SellerPage
      title="Settings"
      description="Manage notification and account preferences."
    >
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Seller Settings</CardTitle>
            <CardDescription>More configuration options will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
              <Settings className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Settings and preferences are coming soon.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SellerPage>
  );
}
