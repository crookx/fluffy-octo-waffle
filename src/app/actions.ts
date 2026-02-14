'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase-admin';
import type { ListingStatus, UserProfile, ImageAnalysis, BadgeSuggestion, Listing, BadgeValue, ListingImage, SavedSearch, Conversation } from '@/lib/types';
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


export async function getAuthenticatedUser(): Promise<{uid: string, role: UserProfile['role'], displayName: string | null} | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) return null;

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        if (!userDoc.exists) return null;
        
        const userProfile = userDoc.data() as UserProfile;
        return { uid: decodedToken.uid, role: userProfile.role, displayName: userProfile.displayName };
    } catch(e) {
        return null;
    }
}

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
  const bio = formData.get('bio') as string;
  const photoFile = formData.get('photo') as File | null;

  if (!displayName) {
    throw new Error('Display name cannot be empty.');
  }
  
  // Handle photo upload to Firebase Storage
  let photoURL: string | null = null;
  if (photoFile && photoFile.size > 0) {
    try {
      const buffer = await photoFile.arrayBuffer();
      const photoPath = `profile-photos/${authUser.uid}/${Date.now()}-${photoFile.name}`;
      const fileRef = adminStorage.bucket().file(photoPath);
      
      await fileRef.save(Buffer.from(buffer), {
        metadata: { contentType: photoFile.type },
      });
      
      // Make file publicly accessible
      await fileRef.makePublic();
      photoURL = `https://storage.googleapis.com/${adminStorage.bucket().name}/${photoPath}`;
    } catch (error) {
      console.error('Photo upload failed:', error);
      throw new Error('Could not upload profile photo. Please try again.');
    }
  }

  // Update Firebase Auth
  await adminAuth.updateUser(authUser.uid, { displayName });

  // Prepare Firestore update
  const updateData: any = {
    displayName: displayName,
    phone: phone || FieldValue.delete(),
    bio: bio || FieldValue.delete(),
  };

  if (photoURL) {
    updateData.photoURL = photoURL;
  }

  // Update Firestore user profile
  await adminDb.collection('users').doc(authUser.uid).update(updateData);

  revalidatePath('/profile');
  revalidatePath('/dashboard');
}

export async function deleteUserAccountAction() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    throw new Error('Authentication required.');
  }

  try {
    // Delete user's listings
    const listingsSnapshot = await adminDb
      .collection('listings')
      .where('sellerId', '==', authUser.uid)
      .get();
    
    for (const doc of listingsSnapshot.docs) {
      // Delete listing images from storage
      const listing = doc.data() as Listing;
      if (listing.images && listing.images.length > 0) {
        for (const image of listing.images) {
          try {
            const fileRef = adminStorage.bucket().file(image.path || '');
            await fileRef.delete();
          } catch (e) {
            console.warn('Could not delete image:', e);
          }
        }
      }
      await doc.ref.delete();
    }

    // Delete user's conversations and messages
    const conversationsSnapshot = await adminDb
      .collectionGroup('conversations')
      .where('participantIds', 'array-contains', authUser.uid)
      .get();
    
    for (const doc of conversationsSnapshot.docs) {
      const messagesSnapshot = await doc.ref.collection('messages').get();
      for (const msgDoc of messagesSnapshot.docs) {
        await msgDoc.delete();
      }
      await doc.delete();
    }

    // Delete user's profile photo if exists
    try {
      const userDoc = await adminDb.collection('users').doc(authUser.uid).get();
      const userData = userDoc.data() as UserProfile;
      if (userData?.photoURL) {
        const photoPath = userData.photoURL.split(`${adminStorage.bucket().name}/`)[1];
        if (photoPath) {
          await adminStorage.bucket().file(photoPath).delete();
        }
      }
    } catch (e) {
      console.warn('Could not delete profile photo:', e);
    }

    // Delete user document from Firestore
    await adminDb.collection('users').doc(authUser.uid).delete();

    // Delete Firebase Auth user
    await adminAuth.deleteUser(authUser.uid);

    revalidatePath('/');
  } catch (error) {
    console.error('Account deletion failed:', error);
    throw new Error('Could not delete your account. Please try again or contact support.');
  }
}

export async function sendEmailVerificationAction() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    throw new Error('Authentication required.');
  }

  try {
    const userRecord = await adminAuth.getUser(authUser.uid);
    if (userRecord.emailVerified) {
      throw new Error('Email is already verified.');
    }

    // Generate verification link using Firebase admin SDK
    const verificationLink = await adminAuth.generateEmailVerificationLink(userRecord.email!);
    
    // Queue email verification email in emailQueue collection
    await adminDb.collection('emailQueue').add({
      to: userRecord.email,
      type: 'email-verification',
      subject: 'Verify Your Kenya Land Trust Account',
      template: 'email-verification',
      variables: {
        displayName: userRecord.displayName || 'User',
        verificationLink: verificationLink,
      },
      createdAt: Timestamp.now(),
      processed: false,
    });

    return { success: true, message: 'Verification email queued. Check your inbox shortly.' };
  } catch (error) {
    console.error('Email verification failed:', error);
    throw new Error('Could not send verification email. Please try again.');
  }
}

export async function changeUserPasswordAction(currentPassword: string, newPassword: string) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    throw new Error('Authentication required.');
  }

  try {
    // Note: Verifying current password requires client-side reauthentication with Firebase SDK
    // This function should only be called after client-side verification
    // For production, implement proper password reset flow
    
    await adminAuth.updateUser(authUser.uid, {
      password: newPassword,
    });

    revalidatePath('/profile');
    return { success: true, message: 'Password changed successfully.' };
  } catch (error) {
    console.error('Password change failed:', error);
    throw new Error('Could not change password. Please try again.');
  }
}

export async function getListingsByIds(ids: string[]): Promise<Listing[]> {
    if (!ids || ids.length === 0) return [];

    // NOTE: Caching on getListingById should prevent excessive reads for the same listings.
    const listingPromises = ids.map(id => getListingById(id));
    const listings = await Promise.all(listingPromises);
    
    // Filter out nulls (not found) and non-approved listings for public view
    return listings.filter((l): l is Listing => l !== null && l.status === 'approved');
}

export async function saveSearchAction(data: { name: string; filters: SavedSearch['filters'], url: string }) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
        throw new Error('Authentication required.');
    }
    const { name, filters, url } = data;
    if (!name) {
        throw new Error('A name for the search is required.');
    }
    const savedSearchData = {
        name,
        filters,
        url,
        createdAt: FieldValue.serverTimestamp(),
    };
    await adminDb.collection('users').doc(authUser.uid).collection('savedSearches').add(savedSearchData);
    revalidatePath('/buyer/dashboard');
}

export async function deleteSearchAction(searchId: string) {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
        throw new Error('Authentication required.');
    }
    await adminDb.collection('users').doc(authUser.uid).collection('savedSearches').doc(searchId).delete();
    revalidatePath('/buyer/dashboard');
}

export async function getSavedSearchesForUser(userId: string): Promise<SavedSearch[]> {
    const snapshot = await adminDb.collection('users').doc(userId).collection('savedSearches').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }) as SavedSearch);
}

export async function getFavoriteListingsForUser(userId: string, limit: number = 5): Promise<Listing[]> {
    const favsSnapshot = await adminDb.collection('users').doc(userId).collection('favorites').orderBy('createdAt', 'desc').limit(limit).get();
    const favIds = favsSnapshot.docs.map(doc => doc.id);
    if (favIds.length === 0) return [];

    const listings = await getListingsByIds(favIds);
    return listings;
}

export async function getRecentConversationsForUser(userId: string, limit: number = 5): Promise<Conversation[]> {
    const snapshot = await adminDb.collection('conversations')
        .where('participantIds', 'array-contains', userId)
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .get();
        
  // Helper to normalize Firestore Timestamps (or legacy _seconds objects) to Date
  const normalizeTimestamp = (ts: any): Date | null => {
    if (!ts) return null;
    // firebase-admin Timestamp instance
    if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate();
    // Firestore client/server representation with _seconds/_nanoseconds
    if (typeof ts === 'object' && (typeof ts._seconds === 'number' || typeof ts.seconds === 'number')) {
      const seconds = ts._seconds ?? ts.seconds;
      const nanos = ts._nanoseconds ?? ts.nanoseconds ?? 0;
      return new Date(seconds * 1000 + Math.floor(nanos / 1e6));
    }
    // Fallback: if it's already a Date
    if (ts instanceof Date) return ts;
    return null;
  };

  return snapshot.docs.map(doc => {
    const raw = doc.data() as any;

    const normalized: Conversation = {
      id: doc.id,
      listingId: raw.listingId,
      listingTitle: raw.listingTitle,
      listingImage: raw.listingImage,
      participantIds: raw.participantIds || [],
      participants: raw.participants || {},
      lastMessage: raw.lastMessage
        ? {
            ...raw.lastMessage,
            timestamp: normalizeTimestamp(raw.lastMessage.timestamp),
          }
        : null,
      updatedAt: normalizeTimestamp(raw.updatedAt),
      status: raw.status,
    } as Conversation;

    return normalized;
  });
}
