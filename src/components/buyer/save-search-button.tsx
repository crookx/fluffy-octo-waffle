'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bookmark, Loader2 } from 'lucide-react';
import type { SavedSearch } from '@/lib/types';
import { saveSearchAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers';
import { useRouter } from 'next/navigation';
import { ToastAction } from '../ui/toast';

interface SaveSearchButtonProps {
  filters: Omit<SavedSearch['filters'], 'name'>;
  disabled?: boolean;
}

export function SaveSearchButton({ filters, disabled }: SaveSearchButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchName, setSearchName] = useState('');

  const handleSave = async () => {
    if (!searchName.trim()) {
      toast({ variant: 'destructive', title: 'A name is required' });
      return;
    }
    setIsSaving(true);
    try {
      const url = `${window.location.pathname}?${new URLSearchParams(window.location.search).toString()}`;
      await saveSearchAction({ name: searchName, filters, url });
      toast({
        title: 'Search Saved!',
        description: `Your search "${searchName}" has been saved to your dashboard.`,
        action: <ToastAction altText="View Dashboard" onClick={() => router.push('/buyer/dashboard')}>View Dashboard</ToastAction>,
      });
      setOpen(false);
      setSearchName('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not save the search.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTriggerClick = () => {
    if (!user) {
         toast({
            title: 'Login Required',
            description: 'You need to be logged in to save searches.',
            action: <ToastAction altText="Login" onClick={() => router.push('/login')}>Login</ToastAction>
        });
        return;
    }
    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={handleTriggerClick} disabled={disabled}>
          <Bookmark className="mr-2 h-4 w-4" />
          Save Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Your Search</DialogTitle>
          <DialogDescription>
            Give this search a name so you can easily run it again from your dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Kajiado Plots under 5M"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
