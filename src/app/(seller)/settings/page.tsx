'use client';

import { useState } from 'react';
import { SellerPage } from '@/components/seller/seller-page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function SellerSettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    businessName: '',
    supportPhone: '',
    listingApprovalEmail: true,
    listingApprovalSms: false,
    messageEmail: true,
    messagePush: true,
    digestFrequency: 'daily',
    marketingUpdates: false,
  });

  const onSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    toast({ title: 'Settings saved', description: 'Your seller preferences have been updated.' });
    setIsSaving(false);
  };

  return (
    <SellerPage title="Settings" description="Manage account, communication, and listing preferences.">
      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile & Business</CardTitle>
            <CardDescription>Basic seller account details used across your listings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business / Display Name</Label>
                <Input
                  id="businessName"
                  value={settings.businessName}
                  onChange={(event) => setSettings((prev) => ({ ...prev, businessName: event.target.value }))}
                  placeholder="e.g., Acme Land Ventures"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportPhone">Support Phone</Label>
                <Input
                  id="supportPhone"
                  value={settings.supportPhone}
                  onChange={(event) => setSettings((prev) => ({ ...prev, supportPhone: event.target.value }))}
                  placeholder="+254 7XX XXX XXX"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listing Notifications</CardTitle>
            <CardDescription>Choose when we should notify you about listing lifecycle changes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Listing approval updates (email)</p>
                <p className="text-sm text-muted-foreground">Get notified when a listing is approved, rejected, or requires edits.</p>
              </div>
              <Switch
                checked={settings.listingApprovalEmail}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, listingApprovalEmail: checked }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Listing approval updates (SMS)</p>
                <p className="text-sm text-muted-foreground">Receive urgent review outcomes via SMS.</p>
              </div>
              <Switch
                checked={settings.listingApprovalSms}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, listingApprovalSms: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Communication Preferences</CardTitle>
            <CardDescription>Control message and digest granularity for buyer conversations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Buyer message alerts (email)</p>
                <p className="text-sm text-muted-foreground">Send an email when a new buyer message arrives.</p>
              </div>
              <Switch
                checked={settings.messageEmail}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, messageEmail: checked }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Buyer message alerts (in-app)</p>
                <p className="text-sm text-muted-foreground">Show real-time notifications while you are active in the dashboard.</p>
              </div>
              <Switch
                checked={settings.messagePush}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, messagePush: checked }))}
              />
            </div>
            <div className="space-y-2 rounded-md border p-3">
              <Label htmlFor="digestFrequency">Digest frequency</Label>
              <Input
                id="digestFrequency"
                value={settings.digestFrequency}
                onChange={(event) => setSettings((prev) => ({ ...prev, digestFrequency: event.target.value }))}
                placeholder="daily / weekly / off"
              />
              <p className="text-xs text-muted-foreground">Set how often you want summary updates for listing and inquiry activity.</p>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Product announcements</p>
                <p className="text-sm text-muted-foreground">Receive updates about new seller tools and policy changes.</p>
              </div>
              <Switch
                checked={settings.marketingUpdates}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, marketingUpdates: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </SellerPage>
  );
}
