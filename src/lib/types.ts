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
  url?: string; // Secure, temporary URL to view the file
};

export type ListingImage = {
  url: string;
  hint: string;
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
  latitude: number;
  longitude: number;
  isApproximateLocation: boolean;
  status: ListingStatus;
  seller: {
    name: string;
    avatarUrl: string;
  };
  evidence: Evidence[];
  images: ListingImage[];
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
  adminReviewedAt?: any; // Firestore timestamp, optional
  imageAnalysis?: ImageAnalysis;
  badgeSuggestion?: BadgeSuggestion;
  badge: BadgeValue | null;
  // Kept for backward compatibility during data transformation in `toListing`
  image?: string; 
  imageHint?: string;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  phone: string | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  createdAt: any; // Firestore timestamp
  verified: boolean;
};

export type Conversation = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  participantIds: string[];
  participants: {
    [key: string]: {
      displayName: string;
      photoURL: string;
    };
  };
  lastMessage: {
    text: string;
    timestamp: any; // or Date
    senderId: string;
  } | null;
  updatedAt: any; // or Date
  status?: 'new' | 'responded' | 'closed';
};

export type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: any; // or Date
};
