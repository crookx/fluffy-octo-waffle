'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ReportListingPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    listingId: '',
    reason: '',
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.listingId || !formState.reason) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please provide the listing ID or URL and a reason for the report.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to submit report.' }));
        throw new Error(error.message || 'Failed to submit report.');
      }

      toast({
        title: 'Report submitted',
        description: 'Thanks for flagging this listing. If you are signed in, we will email a confirmation.',
      });
      setFormState({ listingId: '', reason: '' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Unable to submit your report.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Report a Listing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            If you believe a listing is fraudulent, misleading, or violates our terms, please let us know. Provide the Listing ID and a reason for your report.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="listingId">Listing ID or URL</Label>
              <Input
                id="listingId"
                placeholder="e.g., fpx7qY2v..."
                value={formState.listingId}
                onChange={(event) => setFormState((prev) => ({ ...prev, listingId: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Report</Label>
              <Textarea
                id="reason"
                placeholder="Describe why you are reporting this listing..."
                className="min-h-[120px]"
                value={formState.reason}
                onChange={(event) => setFormState((prev) => ({ ...prev, reason: event.target.value }))}
              />
            </div>
            <Button variant="destructive" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
