'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PlatformSettings } from '@/lib/types';

const SettingsSchema = z.object({
  platformName: z.string().min(1, 'Platform name is required').max(100),
  contactEmail: z.string().email('Invalid contact email'),
  supportEmail: z.string().email('Invalid support email'),
  supportPhone: z.string().optional().default(''),
  siteDescription: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  maxUploadSizeMB: z.coerce.number().min(1, 'Max upload size must be at least 1 MB').max(1000),
  moderationThresholdDays: z.coerce.number().min(1, 'Must be at least 1 day').max(365),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional().default(''),
  enableUserSignups: z.boolean(),
  enableListingCreation: z.boolean(),
  socialFacebook: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  socialTwitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  socialLinkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  trustStats: z.object({
    totalListings: z.coerce.number().min(0),
    totalBuyers: z.coerce.number().min(0),
    fraudCasesResolved: z.coerce.number().min(0),
  }).optional(),
});

type SettingsFormData = z.infer<typeof SettingsSchema>;

export function SettingsForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      platformName: '',
      contactEmail: '',
      supportEmail: '',
      siteDescription: '',
      maxUploadSizeMB: 50,
      moderationThresholdDays: 7,
      maintenanceMode: false,
      maintenanceMessage: '',
      enableUserSignups: true,
      enableListingCreation: true,
    },
  });

  // Fetch current settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/settings');
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to load settings');
        }

        const { data } = await response.json();
        form.reset(data as SettingsFormData);
        setLastSaved(new Date());
      } catch (error: any) {
        console.error('Failed to fetch settings:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading settings',
          description: error.message || 'Failed to load platform settings',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [form, toast]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save settings');
      }

      setLastSaved(new Date());
      toast({
        title: 'Settings updated',
        description: 'Platform settings have been saved successfully.',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error saving settings',
        description: error.message || 'Failed to save platform settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Platform Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Information</CardTitle>
            <CardDescription>
              Core settings and branding for your platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="platformName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Kenya Land Trust"
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="siteDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of your platform"
                      rows={3}
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription>
                    Used for SEO and public-facing content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Contact Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Email addresses for platform communications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contact@platform.com"
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription>
                    Primary contact email for general inquiries
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supportEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="support@platform.com"
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription>
                    Email for user support requests
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Moderation & Upload Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Moderation & Upload Settings</CardTitle>
            <CardDescription>
              Control platform moderation and file upload limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="maxUploadSizeMB"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Upload Size (MB)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum file size allowed per upload (1-1000 MB)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moderationThresholdDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moderation Threshold (Days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription>
                    Days before a listing requires re-review (1-365 days)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Feature Toggles Section */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Toggles</CardTitle>
            <CardDescription>
              Enable or disable key platform features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="enableUserSignups"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base cursor-pointer">Enable User Signups</FormLabel>
                    <FormDescription>
                      Allow new users to create accounts
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSaving}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enableListingCreation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base cursor-pointer">Enable Listing Creation</FormLabel>
                    <FormDescription>
                      Allow sellers to create new listings
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSaving}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Maintenance Mode Section */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Mode</CardTitle>
            <CardDescription>
              Put the platform in maintenance mode if needed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="maintenanceMode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base cursor-pointer">Enable Maintenance Mode</FormLabel>
                    <FormDescription>
                      Display a maintenance message to all visitors
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSaving}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('maintenanceMode') && (
              <FormField
                control={form.control}
                name="maintenanceMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="We are currently performing maintenance. Please try again later."
                        rows={3}
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormDescription>
                      Message shown to users when maintenance mode is enabled
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Social Media Section */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media & Branding</CardTitle>
            <CardDescription>
              Connect your social media profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="supportPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+254 (0) 700 000 000"
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription>
                    Phone number displayed in footer and contact pages
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialFacebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook Profile URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://facebook.com/kenyalandtrust"
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave empty to hide Facebook link
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialTwitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter/X Profile URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://twitter.com/kenyalandtrust"
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave empty to hide Twitter link
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialLinkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Company Page URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://linkedin.com/company/kenyalandtrust"
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave empty to hide LinkedIn link
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Trust Stats Section */}
        <Card>
          <CardHeader>
            <CardTitle>Trust & Social Proof</CardTitle>
            <CardDescription>
              Display trust metrics in the footer to build buyer confidence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="trustStats.totalListings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Verified Listings</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription>
                    Displayed as "10K+" in footer (e.g., enter 10000)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trustStats.totalBuyers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Happy Buyers</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription>
                    Displayed as "5K+" in footer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trustStats.fraudCasesResolved"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fraud Cases Resolved</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of fraud cases successfully resolved (0 for "100% Fraud-Free")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Status Message */}
        {lastSaved && !form.formState.isDirty && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Last saved {lastSaved.toLocaleTimeString()}
            </AlertDescription>
          </Alert>
        )}

        {form.formState.errors && Object.keys(form.formState.errors).length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fix the errors above before saving
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSaving || isLoading}
            size="lg"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => form.reset()}
            disabled={isSaving || isLoading || !form.formState.isDirty}
          >
            Reset
          </Button>
        </div>
      </form>
    </Form>
  );
}
