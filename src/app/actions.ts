'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase-admin';
import type { ListingStatus, UserProfile, ImageAnalysis, BadgeSuggestion, Listing, BadgeValue, ListingImage } from '@/lib/types';
import { summarizeEvidence } from '@/ai/flows/summarize-evidence-for-admin-review';
import { flagSuspiciousUploadPatterns } from '@/ai/flows/flag-suspicious-upload-patterns';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import { generatePropertyDescription } from '@/ai/flows/generate-property-description';
import { analyzePropertyImage } from '@/ai/flows/analyze-property-image';
import { suggestTrustBadge } from '@/ai/flows/suggest-trust-badge';
import { getListings, getListingById, getAdminDashboardStats, getListingStatsByDay } from '@/lib/data';

const generateCoordsFromLocation = (location: string): { latitude: number; longitude: number } => {
    if (!location) return { latitude: 0.0236, longitude: 37.9062 }; // Default to central Kenya

    let hash = 0;
    for (let i = 0; i < location.length; i++) {
        const char = location.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }

    // Bounding box for Kenya
    const latMin = -4.7, latMax = 5.0;
    const lonMin = 34.0, lonMax = 41.9;

    const lat = latMin + ((hash & 0xffff) / 0xffff) * (latMax - latMin);
    const lon = lonMin + (((hash >> 16) & 0xffff) / 0xffff) * (lonMax - lonMin);
    
    return { latitude: parseFloat(lat.toFixed(6)), longitude: parseFloat(lon.toFixed(6)) };
}


async function getAuthenticatedUser(): Promise<{uid: string, role: UserProfile['role']} | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) return null;

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        if (!userDoc.exists) return null;
        
        const userProfile = userDoc.data() as UserProfile;
        return { uid: decodedToken.uid, role: userProfile.role };
    } catch(e) {
        return null;
    }
}

// NOTE: Removed unused `handleLoginRedirectAction` because it caused
// UnrecognizedActionError / mismatched server action IDs in development.
// Redirect logic is handled client-side in `src/app/login/page.tsx`.

// Action to search/filter listings
export async function searchListingsAction(options: {
    query?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    landType?: string;
    badges?: BadgeValue[];
    status?: ListingStatus | 'all';
    sortBy?: string;
    limit?: number;
    startAfter?: string;
}): Promise<{ listings: Listing[]; lastVisibleId: string | null }> {
    return getListings(options);
}

// Action to get admin dashboard stats
export async function getAdminStatsAction() {
  const authUser = await getAuthenticatedUser();
  if (authUser?.role !== 'ADMIN') {
    throw new Error('Authorization required.');
  }
  return getAdminDashboardStats();
}

// Action to get chart data
export async function getChartDataAction() {
  const authUser = await getAuthenticatedUser();
  if (authUser?.role !== 'ADMIN') {
    throw new Error('Authorization required.');
  }
  return getListingStatsByDay(30);
}


// Action to generate a property description
export async function generateDescriptionAction(bulletPoints: string) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      throw new Error('Authentication required.');
    }
    if (!bulletPoints) {
        throw new Error('Bullet points are required to generate a description.');
    }
    const result = await generatePropertyDescription({ bulletPoints });
    return result;
}


// Action to create a new listing
export async function createListing(formData: FormData): Promise<{id: string}> {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    throw new Error('Authentication required. Please log in.');
  }

  const userRecord = await adminAuth.getUser(authUser.uid);

  const title = formData.get('title') as string;
  const allEvidenceContent: string[] = [];
  let imageAnalysisResult: ImageAnalysis | undefined = undefined;
  let badgeSuggestionResult: BadgeSuggestion | undefined = undefined;
  
  const bucket = adminStorage.bucket();
  const docRef = adminDb.collection('listings').doc();
  const uploadedImages: ListingImage[] = [];

  // 1. Handle property images upload and analysis
  const imageFiles = formData.getAll('images') as File[];
  if (!imageFiles || imageFiles.length === 0 || imageFiles[0].size === 0) {
      throw new Error('At least one property image is required.');
  }

  // Process all images, but only analyze the first one
  for (const [index, file] of imageFiles.entries()) {
      if (file.size > 0) {
          const imageBuffer = Buffer.from(await file.arrayBuffer());
          const imagePath = `listings/${authUser.uid}/${docRef.id}/${Date.now()}-${file.name}`;
          
          await bucket.file(imagePath).save(imageBuffer, {
              metadata: { contentType: file.type }
          });
          const imageUrl = `https://storage.googleapis.com/${bucket.name}/${imagePath}`;
          
          uploadedImages.push({ url: imageUrl, hint: 'custom upload' });

          // Only analyze the first image
          if (index === 0) {
              try {
                  const imageDataUri = `data:${file.type};base64,${imageBuffer.toString('base64')}`;
                  imageAnalysisResult = await analyzePropertyImage({ imageDataUri });
              } catch (e) {
                  console.error('Image analysis failed:', e);
                  throw new Error('AI image analysis failed. The first image might be of low quality or an unsupported format.');
              }
          }
      }
  }

  if (uploadedImages.length === 0) {
    throw new Error('Image upload failed. Please try again with valid image files.');
  }

  // 2. Handle evidence upload and OCR
  const evidenceFiles = formData.getAll('evidence') as File[];
  if (evidenceFiles.length > 0 && evidenceFiles[0].size > 0) {
    const evidenceBatch = adminDb.batch();

    await Promise.all(evidenceFiles.map(async (file) => {
        if (file.size > 0) {
            const evidenceRef = adminDb.collection('evidence').doc();
            const filePath = `evidence/${authUser.uid}/${docRef.id}/${Date.now()}-${file.name}`;
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            await bucket.file(filePath).save(fileBuffer, {
                metadata: {
                    contentType: file.type,
                    metadata: { ownerId: authUser.uid, listingId: docRef.id }
                }
            });

            let contentForAi = `(File: ${file.name}, Type: ${file.type} - cannot be summarized)`;
            if (file.type.startsWith('image/')) {
                try {
                    const imageDataUri = `data:${file.type};base64,${fileBuffer.toString('base64')}`;
                    const ocrResult = await extractTextFromImage({ imageDataUri });
                    contentForAi = ocrResult.extractedText?.trim() || `(Image file: ${file.name} - No text found)`;
                } catch (ocrError) {
                    console.error(`OCR failed for ${file.name}:`, ocrError);
                    throw new Error(`AI failed to process document "${file.name}". Please upload a clearer image or a different file type.`);
                }
            }
            allEvidenceContent.push(contentForAi);

            evidenceBatch.set(evidenceRef, {
                listingId: docRef.id,
                ownerId: authUser.uid,
                name: file.name,
                type: 'other',
                storagePath: filePath,
                uploadedAt: FieldValue.serverTimestamp(),
                content: contentForAi,
                verified: false,
            });
        }
    }));
    await evidenceBatch.commit();
  }

  // 3. Suggest a trust badge based on evidence
  if (allEvidenceContent.length > 0) {
      try {
          badgeSuggestionResult = await suggestTrustBadge({ listingTitle: title, evidenceContent: allEvidenceContent });
      } catch(e) {
          console.error('Badge suggestion failed:', e);
           throw new Error('AI badge suggestion failed. The listing will be created without it.');
      }
  }

  // 4. Assemble and save the final listing
  const newListingData = {
    ownerId: authUser.uid,
    title: title,
    location: formData.get('location') as string,
    county: formData.get('county') as string,
    price: Number(formData.get('price')),
    area: Number(formData.get('area')),
    size: formData.get('size') as string,
    landType: formData.get('landType') as string,
    latitude: Number(formData.get('latitude')),
    longitude: Number(formData.get('longitude')),
    description: formData.get('description') as string,
    status: 'pending' as ListingStatus,
    images: uploadedImages,
    badge: null,
    seller: {
        name: userRecord.displayName || 'Anonymous Seller',
        avatarUrl: userRecord.photoURL || `https://i.pravatar.cc/150?u=${authUser.uid}`
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ...(imageAnalysisResult && { imageAnalysis: imageAnalysisResult }),
    ...(badgeSuggestionResult && { badgeSuggestion: badgeSuggestionResult }),
  };

  await docRef.set(newListingData);
  
  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath('/admin');
  
  return { id: docRef.id };
}

export async function editListingAction(listingId: string, formData: FormData): Promise<{id: string}> {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      throw new Error('Authentication required. Please log in.');
    }

    const docRef = adminDb.collection('listings').doc(listingId);
    const listingDoc = await docRef.get();

    if (!listingDoc.exists) {
        throw new Error("Listing not found.");
    }
    
    // Use the raw data for ownership check, don't need full transformation yet
    const rawData = listingDoc.data() as Listing;
    if (rawData.ownerId !== authUser.uid) {
        throw new Error("Authorization failed: You do not own this listing.");
    }

    const bucket = adminStorage.bucket();

    const updatePayload: Record<string, any> = {
        title: formData.get('title') as string,
        location: formData.get('location') as string,
        county: formData.get('county') as string,
        price: Number(formData.get('price')),
        area: Number(formData.get('area')),
        size: formData.get('size') as string,
        landType: formData.get('landType') as string,
        description: formData.get('description') as string,
        latitude: Number(formData.get('latitude')),
        longitude: Number(formData.get('longitude')),
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    // Handle replacing property images
    const newImageFiles = formData.getAll('images') as File[];
    if (newImageFiles.length > 0 && newImageFiles[0].size > 0) {
        const existingListing = await getListingById(listingId); // get full transformed listing
        if(existingListing) {
            // 1. Delete all old images from GCS
            await Promise.all(existingListing.images.map(async (img) => {
                if (img.url.includes(bucket.name)) {
                    try {
                        const oldImagePath = decodeURIComponent(img.url.split(`${bucket.name}/`)[1].split('?')[0]);
                        await bucket.file(oldImagePath).delete();
                    } catch (error) {
                        console.error(`Failed to delete old main image ${img.url}`, error);
                    }
                }
            }));
        }

        // 2. Upload new images
        const uploadedImages: ListingImage[] = [];
        let imageAnalysisResult: ImageAnalysis | undefined = undefined;

        await Promise.all(newImageFiles.map(async(file, index) => {
             if (file.size > 0) {
                const imageBuffer = Buffer.from(await file.arrayBuffer());
                const imagePath = `listings/${authUser.uid}/${listingId}/${Date.now()}-${file.name}`;
                
                await bucket.file(imagePath).save(imageBuffer, {
                    metadata: { contentType: file.type }
                });
                const imageUrl = `https://storage.googleapis.com/${bucket.name}/${imagePath}`;
                
                uploadedImages.push({ url: imageUrl, hint: 'custom upload' });

                // 3. Analyze the new main image (the first one)
                if (index === 0) {
                    try {
                        const imageDataUri = `data:${file.type};base64,${imageBuffer.toString('base64')}`;
                        imageAnalysisResult = await analyzePropertyImage({ imageDataUri });
                    } catch (e) {
                         console.error('Image analysis failed:', e);
                         // Don't block update if analysis fails, just proceed without it
                    }
                }
            }
        }));

        if (uploadedImages.length > 0) {
            updatePayload.images = uploadedImages;
            updatePayload.imageAnalysis = imageAnalysisResult || FieldValue.delete();
            // Editing images should always trigger re-review
            updatePayload.status = 'pending';
            updatePayload.badge = null;
            updatePayload.badgeSuggestion = FieldValue.delete();
        }
    }
    
    // Handle adding new evidence (does not delete existing)
    const evidenceFiles = formData.getAll('evidence') as File[];
    if (evidenceFiles.length > 0 && evidenceFiles[0].size > 0) {
      const evidenceBatch = adminDb.batch();

      await Promise.all(evidenceFiles.map(async (file) => {
          if (file.size > 0) {
              const evidenceRef = adminDb.collection('evidence').doc();
              const filePath = `evidence/${authUser.uid}/${listingId}/${Date.now()}-${file.name}`;
              const fileBuffer = Buffer.from(await file.arrayBuffer());

              await bucket.file(filePath).save(fileBuffer, {
                  metadata: {
                      contentType: file.type,
                      metadata: { ownerId: authUser.uid, listingId: listingId }
                  }
              });

              let contentForAi = `(File: ${file.name}, Type: ${file.type} - cannot be summarized)`;
              if (file.type.startsWith('image/')) {
                  try {
                      const imageDataUri = `data:${file.type};base64,${fileBuffer.toString('base64')}`;
                      const ocrResult = await extractTextFromImage({ imageDataUri });
                      contentForAi = ocrResult.extractedText?.trim() || `(Image file: ${file.name} - No text found)`;
                  } catch (ocrError) {
                      console.error(`OCR failed for ${file.name}:`, ocrError);
                      // Don't throw, just use the placeholder content
                  }
              }

              evidenceBatch.set(evidenceRef, {
                  listingId: listingId,
                  ownerId: authUser.uid,
                  name: file.name,
                  type: 'other',
                  storagePath: filePath,
                  uploadedAt: FieldValue.serverTimestamp(),
                  content: contentForAi,
                  verified: false,
              });
          }
      }));
      await evidenceBatch.commit();
      
      // Adding evidence should also trigger re-review
      updatePayload.status = 'pending';
      updatePayload.badge = null;
      updatePayload.badgeSuggestion = FieldValue.delete();
    }

    // If the listing was rejected, any edit should resubmit it for review.
    if (rawData.status === 'rejected') {
        updatePayload.status = 'pending';
        updatePayload.badge = null; // Reset badge on resubmission
        updatePayload.badgeSuggestion = FieldValue.delete();
    }

    await docRef.update(updatePayload);
    
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath(`/listings/${listingId}`);
    revalidatePath(`/listings/${listingId}/edit`);
    revalidatePath('/admin');
    
    return { id: docRef.id };
}


// Action to update a listing's status and/or badge
export async function updateListing(listingId: string, data: { status?: ListingStatus; badge?: BadgeValue }) {
  const authUser = await getAuthenticatedUser();
  if (authUser?.role !== 'ADMIN') {
    throw new Error('Authorization required: Only admins can update status.');
  }

  const listingRef = adminDb.collection('listings').doc(listingId);

  const updateData: Record<string, any> = {
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Only set adminReviewedAt if status is changing
  if (data.status) {
    updateData.adminReviewedAt = FieldValue.serverTimestamp();
  }

  await listingRef.update(updateData);

  revalidatePath('/admin');
  revalidatePath(`/admin/listings/${listingId}`);
  revalidatePath(`/listings/${listingId}`);
  revalidatePath('/');
}

// Action for admins to bulk update listing statuses
export async function bulkUpdateListingStatus(listingIds: string[], status: ListingStatus): Promise<{ success: boolean }> {
  const authUser = await getAuthenticatedUser();
  if (authUser?.role !== 'ADMIN') {
    throw new Error('Authorization required: Only admins can perform bulk updates.');
  }

  if (!listingIds || listingIds.length === 0) {
    throw new Error('No listings selected for update.');
  }

  const batch = adminDb.batch();

  listingIds.forEach(id => {
    const listingRef = adminDb.collection('listings').doc(id);
    const updateData: Record<string, any> = {
      status,
      updatedAt: FieldValue.serverTimestamp(),
      adminReviewedAt: FieldValue.serverTimestamp(),
    };
    batch.update(listingRef, updateData);
  });

  await batch.commit();

  // Revalidate paths to reflect changes
  revalidatePath('/admin');
  revalidatePath('/'); // Revalidate home page as listings might appear/disappear
  listingIds.forEach(id => {
    revalidatePath(`/listings/${id}`);
    revalidatePath(`/admin/listings/${id}`);
  });
  
  return { success: true };
}

export async function markContactMessageStatus(messageId: string, status: 'new' | 'handled'): Promise<{ success: boolean }> {
    const authUser = await getAuthenticatedUser();
    if (authUser?.role !== 'ADMIN') {
        throw new Error('Authorization required.');
    }
    await adminDb.collection('contactMessages').doc(messageId).update({ status });
    revalidatePath('/admin/inbox');
    revalidatePath('/admin');
    return { success: true };
}

export async function markListingReportStatus(reportId: string, status: 'new' | 'handled'): Promise<{ success: boolean }> {
    const authUser = await getAuthenticatedUser();
    if (authUser?.role !== 'ADMIN') {
        throw new Error('Authorization required.');
    }
    await adminDb.collection('listingReports').doc(reportId).update({ status });
    revalidatePath('/admin/inbox');
    revalidatePath('/admin');
    return { success: true };
}

type InboxItemStatus = 'new' | 'handled' | 'all';

type InboxItems = {
  contactMessages: any[]; // Use any to avoid type issues with Firestore Timestamps on the client
  listingReports: any[];
}

export async function getInboxItemsAction(filters: {
  contactStatus: InboxItemStatus;
  reportStatus: InboxItemStatus;
}): Promise<InboxItems> {
  const authUser = await getAuthenticatedUser();
  if (authUser?.role !== 'ADMIN') {
    throw new Error('Authorization required.');
  }

  const toDateISO = (timestamp?: Timestamp): string | null => {
    if (!timestamp) return null;
    return timestamp.toDate().toISOString();
  };

  const getContactMessages = async () => {
    let query: FirebaseFirestore.Query = adminDb.collection('contactMessages');
    if (filters.contactStatus !== 'all') {
      query = query.where('status', '==', filters.contactStatus);
    }
    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toDateISO(data.createdAt),
      };
    });
  };

  const getListingReports = async () => {
    let query: FirebaseFirestore.Query = adminDb.collection('listingReports');
    if (filters.reportStatus !== 'all') {
      query = query.where('status', '==', filters.reportStatus);
    }
    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toDateISO(data.createdAt),
      };
    });
  };

  const [contactMessages, listingReports] = await Promise.all([
    getContactMessages(),
    getListingReports()
  ]);

  return { contactMessages, listingReports };
}


// Action to delete a listing and its associated evidence
export async function deleteListing(listingId: string) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) throw new Error("Authentication required.");

    // Fetch the transformed listing to get the correct images array
    const listing = await getListingById(listingId);
    if (!listing) throw new Error("Listing not found.");

    // Authorization Check: Must be owner or admin
    if (listing.ownerId !== authUser.uid && authUser.role !== 'ADMIN') {
        throw new Error("Authorization required: You do not have permission to delete this listing.");
    }
    
    const listingRef = adminDb.collection('listings').doc(listingId);
    const writeBatch = adminDb.batch();

    // 1. Delete evidence documents from Firestore
    const evidenceQuery = adminDb.collection('evidence').where('listingId', '==', listingId);
    const evidenceSnapshot = await evidenceQuery.get();
    
    evidenceSnapshot.forEach(doc => {
        writeBatch.delete(doc.ref);
    });

    // 2. Delete files from Cloud Storage
    const bucket = adminStorage.bucket();
    // Delete all property images
    if (listing.images && listing.images.length > 0) {
        await Promise.all(listing.images.map(async (img) => {
            if (img.url.includes(bucket.name)) {
                try {
                    const imagePath = decodeURIComponent(img.url.split(`${bucket.name}/`)[1].split('?')[0]);
                    await bucket.file(imagePath).delete();
                } catch (error) {
                     console.error(`Failed to delete image ${img.url}`, error);
                }
            }
        }));
    }
    // Delete evidence files
    const prefix = `evidence/${listing.ownerId}/${listingId}/`;
    try {
        await bucket.deleteFiles({ prefix });
    } catch (error: any) {
        if (error.code !== 404) { // Ignore not found errors
            console.error(`Failed to delete evidence files for prefix ${prefix}`, error);
        }
    }

    // 3. Delete the main listing document
    writeBatch.delete(listingRef);

    // 4. Commit all deletions
    await writeBatch.commit();

    // 5. Revalidate paths
    revalidatePath('/');
    revalidatePath('/dashboard');
    if (authUser.role === 'ADMIN') {
        revalidatePath('/admin');
    }
}


// Action to call the AI summarization flow
export async function getAiSummary(documentText: string) {
    const authUser = await getAuthenticatedUser();
    if (authUser?.role !== 'ADMIN') {
        throw new Error('Authorization required.');
    }
    if (!documentText) {
        throw new Error('Document text is required to generate a summary.');
    }
    try {
        const result = await summarizeEvidence({ documentText });
        return result;
    } catch(e: any) {
        throw new Error(`AI summarization failed: ${e.message}`);
    }
}

// Action to call the suspicious pattern detection flow
export async function checkSuspiciousPatterns(documentDescriptions: string[]) {
    const authUser = await getAuthenticatedUser();
    if (authUser?.role !== 'ADMIN') {
        throw new Error('Authorization required.');
    }
    if (documentDescriptions.length === 0) {
        throw new Error('At least one document description is required to check for suspicious patterns.');
    }
    try {
        const result = await flagSuspiciousUploadPatterns({ documentDescriptions });
        return result;
    } catch(e: any) {
        throw new Error(`AI fraud detection failed: ${e.message}`);
    }
}

// Action to start or retrieve a conversation
export async function getOrCreateConversation(listingId: string): Promise<{ conversationId: string }> {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    throw new Error('Authentication required.');
  }

  const listing = await getListingById(listingId);
  if (!listing) {
    throw new Error('Listing not found.');
  }

  if (listing.ownerId === authUser.uid) {
    throw new Error('You cannot start a conversation with yourself.');
  }

  const buyerId = authUser.uid;
  const sellerId = listing.ownerId;
  const participantIds = [buyerId, sellerId].sort();
  // Create a deterministic ID to prevent duplicate conversations
  const conversationId = `${participantIds[0]}_${participantIds[1]}_${listingId}`;
  
  const conversationRef = adminDb.collection('conversations').doc(conversationId);
  const conversationDoc = await conversationRef.get();

  if (conversationDoc.exists) {
    return { conversationId };
  } else {
    // Fetch full user profiles to store display names and avatars
    const buyerProfile = await adminAuth.getUser(buyerId);
    const sellerProfile = await adminAuth.getUser(sellerId);

    const newConversationData = {
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.images[0]?.url || '',
      participantIds: [buyerId, sellerId],
      participants: {
        [buyerId]: {
          displayName: buyerProfile.displayName || 'Anonymous',
          photoURL: buyerProfile.photoURL || `https://i.pravatar.cc/150?u=${buyerId}`,
        },
        [sellerId]: {
          displayName: sellerProfile.displayName || 'Anonymous Seller',
          photoURL: sellerProfile.photoURL || `https://i.pravatar.cc/150?u=${sellerId}`,
        },
      },
      lastMessage: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await conversationRef.set(newConversationData);
    revalidatePath('/messages');
    return { conversationId };
  }
}

export async function updateUserProfileAction(formData: FormData) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    throw new Error('Authentication required.');
  }

  const displayName = formData.get('displayName') as string;
  const phone = formData.get('phone') as string;

  if (!displayName) {
    throw new Error('Display name cannot be empty.');
  }
  
  const updatePayload: { displayName: string; phone?: string } = { displayName };
  if (phone) {
    updatePayload.phone = phone;
  }

  // Update Firebase Auth
  await adminAuth.updateUser(authUser.uid, { displayName });

  // Update Firestore user profile
  await adminDb.collection('users').doc(authUser.uid).update({
    displayName: displayName,
    phone: phone || FieldValue.delete(),
  });

  revalidatePath('/profile');
  revalidatePath('/dashboard');
}

export async function getListingsByIds(ids: string[]): Promise<Listing[]> {
    if (!ids || ids.length === 0) return [];

    // NOTE: Caching on getListingById should prevent excessive reads for the same listings.
    const listingPromises = ids.map(id => getListingById(id));
    const listings = await Promise.all(listingPromises);
    
    // Filter out nulls (not found) and non-approved listings
    return listings.filter((l): l is Listing => l !== null && l.status === 'approved');
}

    

    