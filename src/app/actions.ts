'use server';

import { revalidatePath } from 'next/cache';
import { addListing, getListings, updateListing } from '@/lib/data';
import type { BadgeStatus, Listing } from '@/lib/types';
import { summarizeEvidence } from '@/ai/flows/summarize-evidence-for-admin-review';
import { flagSuspiciousUploadPatterns } from '@/ai/flows/flag-suspicious-upload-patterns';

// Action to create a new listing
export async function createListing(formData: FormData): Promise<Listing> {
  const newListingData = {
    title: formData.get('title') as string,
    location: formData.get('location') as string,
    price: Number(formData.get('price')),
    description: formData.get('description') as string,
    // In a real app, handle file uploads to a storage service like Cloud Storage
    // For now, we'll just check if files were included.
    badge: formData.has('evidence') ? ('EvidenceSubmitted' as BadgeStatus) : ('None' as BadgeStatus),
    image: 'https://picsum.photos/seed/newland/600/400',
    imageHint: 'generic landscape',
    seller: {
      name: 'New Seller', // Placeholder
      avatarUrl: 'https://i.pravatar.cc/150?u=newseller',
    },
    evidence: [], // Placeholder for evidence handling
  };
  
  const newListing = await addListing(newListingData);

  revalidatePath('/');
  revalidatePath('/admin');
  
  return newListing;
}

// Action to update a listing's badge
export async function updateListingBadge(listingId: string, badge: BadgeStatus) {
  const listings = await getListings();
  const listing = listings.find((l) => l.id === listingId);

  if (!listing) {
    throw new Error('Listing not found');
  }

  listing.badge = badge;
  await updateListing(listing);

  revalidatePath('/admin');
  revalidatePath(`/admin/listings/${listingId}`);
  revalidatePath(`/listings/${listingId}`);
}

// Action to call the AI summarization flow
export async function getAiSummary(documentText: string) {
    if (!documentText) {
        throw new Error('Document text is required.');
    }
    const result = await summarizeEvidence({ documentText });
    return result;
}

// Action to call the suspicious pattern detection flow
export async function checkSuspiciousPatterns(documentDescriptions: string[]) {
    if (documentDescriptions.length === 0) {
        throw new Error('At least one document description is required.');
    }
    const result = await flagSuspiciousUploadPatterns({ documentDescriptions });
    return result;
}
