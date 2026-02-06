'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Listing, ListingStatus, BadgeValue } from '@/lib/types';
import { updateListing, getAiSummary, checkSuspiciousPatterns, deleteListing } from '@/app/actions';
import { Separator } from '@/components/ui/separator';
import { Bot, Sparkles, AlertTriangle, FileText, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrustBadge } from '@/components/trust-badge';

const statusOptions: { value: ListingStatus; label: string }[] = [
  { value: 'approved', label: 'Approve' },
  { value: 'pending', label: 'Set to Pending' },
  { value: 'rejected', label: 'Reject' },
];

const badgeOptions: BadgeValue[] = ['Gold', 'Silver', 'Bronze', 'None'];

export function AdminActions({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<ListingStatus>(listing.status);
  const [currentBadge, setCurrentBadge] = useState<BadgeValue | null>(listing.badge);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, string>>(
    listing.evidence.reduce((acc, doc) => {
        if(doc.summary) {
            acc[doc.id] = doc.summary;
        }
        return acc;
    }, {} as Record<string, string>)
  );
  const [suspicionResult, setSuspicionResult] = useState<{ isSuspicious: boolean; reason: string } | null>(null);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateListing(listing.id, { status: currentStatus, badge: currentBadge || 'None' });
      toast({
        title: 'Success',
        description: 'Listing has been updated.',
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update listing.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
     try {
      await deleteListing(listing.id);
      toast({
        title: 'Success',
        description: 'Listing has been deleted.',
      });
      router.push('/admin');
      router.refresh();
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete listing.',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const handleSummarize = async (docId: string, docContent: string) => {
    setIsSummarizing(docId);
    try {
      const result = await getAiSummary(docContent);
      setSummaries(prev => ({...prev, [docId]: result.summary}));
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Failed to generate summary.',
      });
    } finally {
        setIsSummarizing(null);
    }
  }

  const handleSuspicionCheck = async () => {
    setIsChecking(true);
    setSuspicionResult(null);
    try {
        const descriptions = listing.evidence.map(e => e.content);
        if (descriptions.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'No evidence to check.' });
            setIsChecking(false);
            return;
        }
        const result = await checkSuspiciousPatterns(descriptions);
        setSuspicionResult({ isSuspicious: result.isSuspicious, reason: result.reason || 'No specific reason provided.' });

    } catch(error) {
        toast({
            variant: 'destructive',
            title: 'AI Error',
            description: 'Failed to run suspicion check.',
        });
    } finally {
        setIsChecking(false);
    }
  }

  const isChanged = currentStatus !== listing.status || currentBadge !== listing.badge;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manage Listing</CardTitle>
          <CardDescription>Approve, reject, or delete this listing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-semibold">Status</Label>
            <RadioGroup value={currentStatus} onValueChange={(value: ListingStatus) => setCurrentStatus(value)} className="mt-2">
                {statusOptions.map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`status-${value}`} />
                    <Label htmlFor={`status-${value}`}>{label}</Label>
                </div>
                ))}
            </RadioGroup>
          </div>
          <div>
             <Label className="font-semibold">Trust Badge</Label>
            <Select
                value={currentBadge || ''}
                onValueChange={(value: BadgeValue) => setCurrentBadge(value)}
            >
                <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a badge" />
                </SelectTrigger>
                <SelectContent>
                    {badgeOptions.map((badge) => (
                        <SelectItem key={badge} value={badge}>
                            <div className="flex items-center gap-2">
                                <TrustBadge badge={badge} showTooltip={false} />
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={isSaving || !isChanged}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" disabled={isDeleting} aria-label="Delete listing">
                  <Trash2 />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    listing, its main image, and all associated evidence files.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot /> AI Assistant & Insights
          </CardTitle>
          <CardDescription>GenAI tools to accelerate your review process.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {listing.badgeSuggestion && (
            <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="text-accent h-4 w-4"/>Trust Badge Suggestion</h4>
                <div className="p-3 rounded-md border bg-secondary/50">
                    <div className="flex items-center gap-2">
                         <TrustBadge badge={listing.badgeSuggestion.badge} showTooltip={false} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{listing.badgeSuggestion.reason}</p>
                </div>
            </div>
           )}
           {listing.imageAnalysis?.isSuspicious && (
            <div>
                 <h4 className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="text-warning h-4 w-4"/>Image Analysis</h4>
                 <div className="p-3 rounded-md border border-destructive/50 bg-destructive/10">
                    <p className="font-bold text-destructive">Result: Suspicious Image</p>
                    <p className="text-sm text-muted-foreground mt-1">{listing.imageAnalysis.reason}</p>
                 </div>
            </div>
           )}
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Document Tools</h4>
            {listing.evidence.length > 0 ? (
                <div className="space-y-3">
                {listing.evidence.map(doc => (
                    <div key={doc.id}>
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <p className="text-sm font-medium truncate flex-1" title={doc.name}>{doc.name}</p>
                             <Button size="sm" variant="outline" onClick={() => handleSummarize(doc.id, doc.content)} disabled={!!isSummarizing}>
                                {isSummarizing === doc.id ? <Loader2 className="h-4 w-4 animate-spin"/> : "Summarize"}
                            </Button>
                        </div>
                        {summaries[doc.id] && (
                             <div className="text-xs text-muted-foreground p-2 bg-secondary rounded-md ml-6">{summaries[doc.id]}</div>
                        )}
                    </div>
                ))}
                </div>
            ) : <p className="text-sm text-muted-foreground">No evidence to analyze.</p>}
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Fraud Detection</h4>
            <Button className="w-full" onClick={handleSuspicionCheck} disabled={isChecking || listing.evidence.length === 0}>
                {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Check for Suspicious Patterns"}
            </Button>
             {suspicionResult && (
                <div className={`mt-4 p-3 rounded-md border ${suspicionResult.isSuspicious ? 'border-destructive/50 bg-destructive/10' : 'border-success/50 bg-success/10'}`}>
                    <p className={`font-bold ${suspicionResult.isSuspicious ? 'text-destructive' : 'text-success'}`}>
                        {suspicionResult.isSuspicious ? 'Result: Suspicious' : 'Result: Not Suspicious'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{suspicionResult.reason}</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
