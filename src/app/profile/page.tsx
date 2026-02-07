'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/components/providers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfileAction } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SellerPage } from '@/components/seller/seller-page';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
  phone: z.string().optional(),
  email: z.string().email(),
});

export default function ProfilePage() {
  const { userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      displayName: userProfile?.displayName || '',
      phone: userProfile?.phone || '',
      email: userProfile?.email || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('displayName', values.displayName);
      if (values.phone) {
        formData.append('phone', values.phone);
      }
      
      await updateUserProfileAction(formData);

      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Could not save your profile.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }
  
  if (!userProfile) {
    return (
        <SellerPage title="Profile">
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Could not load user profile. Please try logging in again.</p>
              </CardContent>
            </Card>
          </div>
        </SellerPage>
    )
  }

  return (
    <SellerPage
      title="Profile"
      description="Update your personal information. Your email address cannot be changed."
    >
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Manage Profile</CardTitle>
            <CardDescription>Keep your contact details up to date for buyers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Your phone number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional, but helps with communication.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input readOnly disabled {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </SellerPage>
  );
}


function ProfileSkeleton() {
    return (
        <SellerPage title="Profile">
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full max-w-sm mt-2" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          </div>
        </SellerPage>
    )
}
