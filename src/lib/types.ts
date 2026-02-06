export type ListingStatus = 'pending' | 'approved' | 'rejected';

export type BadgeValue = 'Gold' | 'Silver' | 'Bronze' | 'None';

export type BadgeSuggestion = {
  badge: BadgeValue;
  reason: string;
};

export type ImageAnalysis = {
  isSuspicious: boolean;
  reason: string;
};

export type Evidence = {
  id: string;
  listingId: string;
  ownerId: string;
  type: 'title_deed' | 'survey_map' | 'other';
  name: string;
  storagePath: string; // Path to the document in Firebase Storage
  uploadedAt: any; // Firestore timestamp
  summary?: string;
  content: string; // Plain text content for AI summarization, or filename if content not available
  verified: boolean;
};

export type Listing = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  price: number;
  location: string; // General location string for display
  county: string;
  area: number; // e.g., in Acres
  size: string; // e.g., "50x100 ft"
  landType: string; // e.g., "Agricultural", "Residential"
  status: ListingStatus;
  seller: {
    name: string;
    avatarUrl: string;
  };
  evidence: Evidence[];
  image: string; // Main image for the listing
  imageHint: string;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
  adminReviewedAt?: any; // Firestore timestamp, optional
  imageAnalysis?: ImageAnalysis;
  badgeSuggestion?: BadgeSuggestion;
  badge: BadgeValue | null;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  phone: string | null;
  role: 'SELLER' | 'ADMIN';
  createdAt: any; // Firestore timestamp
  verified: boolean;
};
