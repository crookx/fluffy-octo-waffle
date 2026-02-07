'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { BadgeValue, Listing, ListingStatus } from '@/lib/types';
import { deleteListing, updateListing } from '@/app/actions';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TrustBadge } from '@/components/trust-badge';

const statusOptions: { value: ListingStatus; label: string }[] = [
  { value: 'approved', label: 'Approve' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Reject' },
];

const badgeOptions: BadgeValue[] = ['Gold', 'Silver', 'Bronze', 'None'];

export function AdminReviewActions({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<ListingStatus>(
    listing.status
  );
  const [currentBadge, setCurrentBadge] = useState<BadgeValue | null>(
    listing.badge
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRejectConfirmOpen, setRejectConfirmOpen] = useState(false);

  const isChanged =
    currentStatus !== listing.status || currentBadge !== listing.badge;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateListing(listing.id, {
        status: currentStatus,
        badge: currentBadge || 'None',
      });
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
      setRejectConfirmOpen(false);
    }
  };

  const handleSaveClick = () => {
    if (currentStatus === 'rejected' && listing.status !== 'rejected') {
      setRejectConfirmOpen(true);
    } else {
      handleSave();
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
  };

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <Select
        value={currentStatus}
        onValueChange={(v: ListingStatus) => setCurrentStatus(v)}
      >
        <SelectTrigger className="w-full sm:w-[120px]">
          <SelectValue placeholder="Set status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentBadge || ''}
        onValueChange={(v: BadgeValue) => setCurrentBadge(v)}
      >
        <SelectTrigger className="w-full sm:w-[120px]">
          <SelectValue placeholder="Set badge" />
        </SelectTrigger>
        <SelectContent>
          {badgeOptions.map((badge) => (
            <SelectItem key={badge} value={badge}>
              <TrustBadge badge={badge} showTooltip={false} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={handleSaveClick}
        disabled={isSaving || !isChanged}
        className="w-full sm:w-auto"
      >
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            disabled={isDeleting}
            aria-label="Delete listing"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              listing, its images, and all associated evidence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to reject this listing?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the listing as &apos;Rejected&apos; and it will
              no longer be visible to the public. The seller will see this
              status in their dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Yes, Reject Listing'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
