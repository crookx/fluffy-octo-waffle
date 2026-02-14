# Kenya Land Trust - Comprehensive Codebase Analysis

**Last Updated:** February 2026  
**Project Type:** Next.js 15 + Firebase + Genkit AI  
**Status:** Production-ready marketplace with advanced AI features

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Three-Role User System](#three-role-user-system)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Authentication & Security](#authentication--security)
6. [Core Features Deep Dive](#core-features-deep-dive)
7. [Data Flow Patterns](#data-flow-patterns)
8. [AI Integration](#ai-integration)
9. [Database Schema](#database-schema)
10. [Key Patterns & Conventions](#key-patterns--conventions)
11. [Development Workflow](#development-workflow)
12. [Performance & Deployment](#performance--deployment)

---

## Architecture Overview

### High-Level Design

Kenya Land Trust is built as a **three-tier role-based marketplace** with distinct user experiences:

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS 15 Frontend                       │
├──────────────────┬──────────────────┬──────────────────────┤
│   Buyer Routes   │  Seller Routes   │  Admin Routes        │
│  (Public/Auth)   │  (Protected)     │  (Restricted)        │
└──────────────────┴──────────────────┴──────────────────────┘
         ↓                ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│         Server Actions & API Routes (Middleware Auth)       │
│  (/api/listings, /api/auth, /api/contact, etc.)            │
└─────────────────────────────────────────────────────────────┘
         ↓                ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│              Firebase Backend                               │
├─────────────────────────────────────────────────────────────┤
│  • Firestore (Data)     • Auth (Sessions)                   │
│  • Cloud Storage (Files) • Security Rules (Access Control)  │
│  • Admin SDK (Server Logic)                                 │
└─────────────────────────────────────────────────────────────┘
         ↓                ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│      Genkit AI Flows (Google AI / Gemini 2.5 Flash)        │
│  • Evidence Summarization  • Trust Badge Suggestion         │
│  • Property Image Analysis • Document OCR                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Three-Role User System

### Role Definition & Permissions

| Role | Landing Page | Workspace | Key Features |
|------|---|---|---|
| **BUYER** (default) | Public browse, search | `/buyer/dashboard` | Save searches, favorites, messaging |
| **SELLER** | Can upgrade | `/dashboard`, `/listings/*` | Create listings, upload evidence, analytics |
| **ADMIN** | N/A | `/admin/*` | Review listings, assign badges, platform settings |

### Route Groups Structure

Next.js route groups isolate role-specific experiences:

```
src/app/
├── (buyer)/           ← Public + buyer auth routes
│   ├── layout.tsx     ← BuyerHeader + BuyerFooter
│   ├── page.tsx       ← Landing page with featured listings
│   ├── /login, /signup
│   ├── /explore       ← Browse & filter approved listings
│   ├── /messages      ← Buyer-seller conversations
│   └── /favorites     ← User's saved listings
│
├── (seller)/          ← Seller-protected workspace
│   ├── layout.tsx     ← SidebarProvider + SellerNav
│   ├── /dashboard     ← Seller analytics & quick actions
│   ├── /listings      ← Manage seller's listings
│   │   ├── /new       ← Create listing flow
│   │   └── /[id]/edit ← Edit existing listing
│   └── /settings      ← Seller profile & preferences
│
├── admin/             ← Admin-protected workspace
│   ├── layout.tsx     ← SidebarProvider + AdminNav
│   ├── page.tsx       ← Admin dashboard (stats, charts)
│   ├── /listings      ← Moderation interface
│   ├── /analytics     ← Platform metrics
│   ├── /inbox         ← Messages & reports
│   └── /settings      ← Platform configuration
│
├── /profile, /messages  ← General protected routes (any auth user)
└── /api/              ← Server API routes
```

**Critical:** Routes outside route groups (`/profile`, `/messages`, `/favorites`) are protected but accessible by **any authenticated role**.

---

## Technology Stack

### Frontend
- **Framework:** Next.js 15.5.9 (Turbopack for 3x faster dev)
- **Port:** 9002 (not 3000)
- **UI Library:** Shadcn/UI + Radix UI (accessible primitives)
- **Styling:** Tailwind CSS 3.4.1 with custom design system
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod validation
- **Data Visualization:** Recharts

### Backend
- **Runtime:** Node.js (server actions, middleware)
- **Database:** Firebase Firestore (document store)
- **Storage:** Firebase Cloud Storage (images, documents)
- **Auth:** Firebase Auth + custom session cookies (`__session`)
- **Admin SDK:** firebase-admin 12.2.0 (server-side privileged ops)

### AI/ML
- **Framework:** Genkit 1.20.0
- **Model:** Google Gemini 2.5 Flash
- **Uses:** Document analysis, evidence summarization, badge suggestion

### DevOps
- **Deployment:** Firebase Hosting / Vercel / App Hosting
- **Type Checking:** TypeScript (strict mode)
- **Linting:** ESLint + Prettier
- **Package Manager:** npm
- **Build:** `npm run build` (production with minification)

---

## Project Structure

### Directory Layout

```
/home/devmahnx/Downloads/land/fluffy-octo-waffle/
│
├── .github/
│   └── copilot-instructions.md  ← Dev guidelines
│
├── docs/
│   └── blueprint.md              ← Design system & features
│
├── src/
│   ├── app/                      ← Next.js app routes
│   │   ├── layout.tsx            ← Root layout + AuthProvider
│   │   ├── actions.ts            ← Server actions (100+ lines)
│   │   ├── (buyer)/, (seller)/, admin/ ← Route groups
│   │   └── api/                  ← API routes
│   │
│   ├── components/
│   │   ├── buyer/                ← Landing, header, footer, hero
│   │   ├── seller/               ← Workspace nav & shells
│   │   ├── admin/                ← Admin nav & utilities
│   │   ├── ui/                   ← Shadcn primitives
│   │   ├── chat/                 ← Messaging components
│   │   └── *.tsx                 ← Shared components (trust badge, etc.)
│   │
│   ├── lib/
│   │   ├── firebase.ts           ← Client Firebase config
│   │   ├── firebase-admin.ts     ← Server Firebase Admin setup
│   │   ├── types.ts              ← Type definitions (Listing, UserProfile, etc.)
│   │   ├── data.ts               ← Data fetching helpers (getListings, etc.)
│   │   ├── conversation-status.ts
│   │   ├── utils.ts              ← Utilities (cn, etc.)
│   │   └── seed.ts               ← Database seeding
│   │
│   ├── ai/
│   │   ├── genkit.ts             ← Genkit config
│   │   ├── dev.ts                ← Dev environment setup
│   │   └── flows/                ← AI flow definitions
│   │       ├── suggest-trust-badge.ts
│   │       ├── summarize-evidence-for-admin-review.ts
│   │       ├── analyze-property-image.ts
│   │       ├── extract-text-from-image.ts
│   │       ├── generate-property-description.ts
│   │       └── flag-suspicious-upload-patterns.ts
│   │
│   ├── hooks/                    ← React hooks
│   │   ├── use-auth.ts           ← Auth context hook
│   │   ├── use-favorites.ts
│   │   └── use-mobile.tsx
│   │
│   ├── globals.css               ← Tailwind directives + CSS vars
│   └── middleware.ts             ← Role-based route protection
│
├── firestore.rules               ← Firestore security rules
├── storage.rules                 ← Cloud Storage rules
├── tailwind.config.ts            ← Design tokens & colors
├── tsconfig.json                 ← TypeScript config
├── next.config.ts                ← Next.js config
├── components.json               ← Shadcn CLI config
├── firebase.json                 ← Firebase project config
├── package.json                  ← Dependencies + scripts
└── serviceAccountKey.json        ← Firebase admin credentials (dev only)
```

### Key File Sizes (Estimated)

- `src/app/actions.ts` → 1,000+ lines (all server actions)
- `src/app/(seller)/listings/new/page.tsx` → 400+ lines (create flow)
- `src/lib/data.ts` → 390+ lines (data fetching)
- `src/app/admin/listings/page.tsx` → 300+ lines (moderation UI)
- `src/middleware.ts` → 200+ lines (auth + role checks)

---

## Authentication & Security

### Session Management

1. **Firebase Auth** handles user signup/login
2. **Custom Session Cookie** (`__session`) issued on `/api/auth/session` POST
3. **Middleware Verification** validates on every protected route
4. **Admin SDK** verifies session server-side (prevents tampering)

```typescript
// In middleware.ts
const sessionCookie = request.cookies.get('__session')?.value;
const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
const userRole = userDoc.data()?.role; // Fetch fresh from DB
```

### Three-Layer Authorization

| Layer | Purpose | Implementation |
|-------|---------|---|
| **UI Layer** | Conditional rendering | `useAuth()` hook, component checks |
| **Middleware** | Route protection | Role-based redirects in `middleware.ts` |
| **Database** | Data-level access control | Firestore security rules (RLS) |

### Firestore Security Rules

```
/users/{userId}
  ✓ Read: self or admin
  ✓ Write: self only
  /favorites/{listingId}
  /savedSearches/{searchId}

/listings/{listingId}
  ✓ Get: approved OR (owner OR admin)
  ✓ List: admin views all, others see approved
  ✓ Create: any auth user
  ✓ Update: owner (except status) OR admin
  ✓ Delete: owner OR admin

/evidence/{evidenceId}
  ✓ Read: (listing owner OR admin)
  ✓ Create: listing owner only
  ✓ Update/Delete: owner OR admin

/conversations/{conversationId}
  ✓ CRUD: participants only
  /messages/{messageId}
    ✓ Read: conversation participants
    ✓ Create: participants as themselves

/contactMessages, /listingReports
  ✓ Admin-only read/update
```

### Environment Setup

The app supports **flexible credential injection** for deployment:

```bash
# Priority order for Firebase Admin credentials:
1. FIREBASE_SERVICE_ACCOUNT_KEY_B64  ← Recommended (base64 encoded)
2. FIREBASE_SERVICE_ACCOUNT_KEY      ← JSON string
3. Individual env vars               ← FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
4. Local serviceAccountKey.json      ← Development only
```

---

## Core Features Deep Dive

### Feature 1: Listing Creation (Seller Workflow)

**Entry Point:** `src/app/(seller)/listings/new/page.tsx`

**Flow:**
1. **Form Schema Validation** (Zod)
   - Title, location, county, price, area, size, landType, description
   - Images (required), evidence documents (optional)

2. **AI-Enhanced Upload** (`createListing` action)
   ```typescript
   // Step-by-step process:
   
   // 1. Upload property images to Firebase Storage
   //    → Only FIRST image analyzed for suspicious patterns
   await bucket.file(imagePath).save(imageBuffer);
   imageAnalysisResult = await analyzePropertyImage({ imageDataUri });
   
   // 2. Process evidence documents
   //    → OCR extraction on image files
   //    → Plain text for PDFs (fallback)
   contentForAi = await extractTextFromImage({ imageDataUri });
   
   // 3. Store evidence metadata in Firestore
   evidenceBatch.set(evidenceRef, {
     listingId, ownerId, name, type, storagePath, 
     uploadedAt, content (OCR), verified: false
   });
   
   // 4. AI Badge Suggestion (if evidence provided)
   badgeSuggestionResult = await suggestTrustBadge({
     listingTitle, evidenceContent: [...]
   });
   
   // 5. Save listing with status='pending' (requires admin approval)
   await docRef.set(newListingData);
   revalidatePath('/'); // Revalidate ISR cache
   ```

3. **Upload Progress Tracking**
   - Client-side progress bar (simulated with intervals)
   - Backend handles all file operations in parallel

**Storage Structure:**
```
gs://kenya-land-trust.appspot.com/
├── listings/{userId}/{listingId}/{timestamp}-{filename}  ← Images
└── evidence/{userId}/{listingId}/{timestamp}-{filename}  ← Documents
```

### Feature 2: Trust Badge System

**Badges:** Gold → Silver → Bronze → None

**Assignment Flow:**
1. **AI Suggestion** (automatic on listing creation)
   - `suggestTrustBadge()` analyzes OCR'd evidence
   - Returns badge + reasoning

2. **Admin Review** (`src/app/admin/listings/[id]/page.tsx`)
   - Admins view listing + evidence documents
   - Can override AI suggestion
   - Assign badge → listing status changes to `approved`

3. **Badge Display**
   - Component: `TrustBadge` (icons: Award/Shield/ShieldQuestion)
   - Styled variants: gold/silver/bronze/secondary
   - Tooltips explain each badge tier

**Badge Criteria (from AI prompt):**
- **Gold:** All key docs (title, survey) clear & consistent
- **Silver:** Most docs present, minor gaps
- **Bronze:** Some evidence, key docs missing
- **None:** Little/no credible evidence

### Feature 3: Listing Moderation (Admin Workflow)

**Page:** `src/app/admin/listings/page.tsx`

**Capabilities:**
- Search by title/location/seller
- Filter by status (pending/approved/rejected)
- Bulk update status actions
- Pagination (12 items/page)

**Single Listing Review:**
- View all evidence with signed URLs (15-min expiry)
- Assign trust badge + set status
- Add admin notes
- Archive/delete suspicious listings

### Feature 4: Messaging System

**Core Collections:**
```
/conversations/{conversationId}
  - listingId, participantIds, lastMessage, status
  - /messages/{messageId}
    - senderId, text, timestamp
```

**Features:**
- Initiated when buyer messages seller (auto-create conversation)
- Buyer-seller 1-on-1 messaging
- Status tracking: new → responded → closed
- Seller dashboard shows recent conversations

### Feature 5: Evidence Management

**Evidence Document Types:**
- `title_deed`, `survey_map`, `other`

**Processing Pipeline:**
1. Upload file → Firebase Storage
2. **If image:** OCR extraction via `extractTextFromImage` flow
3. Store metadata in `/evidence` collection
4. Generate 15-min signed URL for viewing
5. Admin summarizes via `summarizeEvidence` flow (optional)

**Example Evidence Document:**
```typescript
{
  id: "doc-abc123",
  listingId: "listing-456",
  ownerId: "user-789",
  name: "Title_Deed_Official.pdf",
  type: "title_deed",
  storagePath: "evidence/user-789/listing-456/1708956000-Title_Deed.pdf",
  uploadedAt: Timestamp(2026-02-14),
  content: "Plot Number: AP/2/956... Owner: John Doe... Area: 0.5 acres...",
  verified: false,
  url: "https://storage.googleapis.com/..." // Signed URL
}
```

---

## Data Flow Patterns

### Server Action Pattern (Do This)

```typescript
// src/app/actions.ts - ALL data mutations go here
'use server';

export async function createListing(formData: FormData): Promise<{id: string}> {
  // 1. Authenticate (get user from session cookie)
  const authUser = await getAuthenticatedUser();
  if (!authUser) throw new Error('Authentication required.');
  
  // 2. Authorize (check role if needed)
  if (authUser.role !== 'SELLER') throw new Error('Unauthorized.');
  
  // 3. Validate (Zod schemas in types.ts)
  const title = formData.get('title') as string;
  
  // 4. Fetch data if needed (use helpers from lib/data.ts)
  const userDoc = await adminDb.collection('users').doc(authUser.uid).get();
  
  // 5. Perform operations (database + storage + AI)
  await bucket.file(path).save(buffer);
  await docRef.set(data);
  
  // 6. Cache revalidation
  revalidatePath('/');
  
  // 7. Return result
  return { id: docRef.id };
}
```

**Why?**
- ✅ Direct Firebase Admin access (safe)
- ✅ No credentials in client code
- ✅ Network request hidden from Firestore rules
- ✅ Large file uploads without streaming to browser

### Data Fetching Pattern

```typescript
// src/lib/data.ts - Reusable data queries
export const getListings = async (options: {
  query?: string;
  status?: ListingStatus;
  limit?: number;
}) => {
  // 1. Build Firestore query
  let q = adminDb.collection('listings');
  if (options.status !== 'all') {
    q = q.where('status', '==', options.status);
  }
  
  // 2. Fetch with pagination
  q = q.limit(options.limit || 10);
  const snapshot = await q.get();
  
  // 3. Transform documents
  const listings = snapshot.docs.map(doc => toListing(doc));
  
  // 4. Fetch nested data (evidence + signed URLs)
  const withEvidence = await Promise.all(
    listings.map(async (listing) => ({
      ...listing,
      evidence: await getEvidenceForListing(listing.id)
    }))
  );
  
  return withEvidence;
};
```

**Use in Components:**
```typescript
// In server component or server action
const listings = await getListings({ status: 'approved' });

// NOT in client components (no client Firebase access)
// const listings = await getListings(); // ❌ Won't work
```

---

## AI Integration

### Genkit Setup

```typescript
// src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash', // Fast, capable model
});
```

**Start Dev Server:**
```bash
npm run genkit:dev        # Start Genkit server
npm run genkit:watch      # With hot reload
```

### AI Flows (6 Total)

| Flow | Input | Output | Use Case |
|------|-------|--------|---|
| **suggest-trust-badge** | listingTitle + OCR text | badge + reason | Auto-suggest badge on listing creation |
| **summarize-evidence** | document text | summary | Admin review - quick understanding |
| **extract-text-from-image** | base64 image | extracted text (OCR) | Process image evidence documents |
| **analyze-property-image** | property photo | isSuspicious + reason | Flag low-quality/fake photos |
| **generate-property-description** | bullet points | rich description | Seller tool - write descriptions |
| **flag-suspicious-patterns** | evidence paths | flagged items + reasons | Detect fraud patterns |

### Example: Trust Badge Flow

```typescript
// src/ai/flows/suggest-trust-badge.ts
const SuggestTrustBadgeInputSchema = z.object({
  listingTitle: z.string(),
  evidenceContent: z.array(z.string()), // OCR'd document text
});

const prompt = ai.definePrompt({
  name: 'suggestTrustBadgePrompt',
  input: { schema: SuggestTrustBadgeInputSchema },
  output: { schema: SuggestTrustBadgeOutputSchema },
  prompt: `You are an AI assistant for a land marketplace...
  
  - **Gold:** All key documents present, clear & consistent
  - **Silver:** Most docs present, minor gaps
  - **Bronze:** Some evidence, key docs missing
  - **None:** Little evidence
  
  Evidence Content:
  {{#each evidenceContent}}
  - {{{this}}}
  {{/each}}
  
  Based on the evidence, suggest a badge and provide reasoning.`,
});

export async function suggestTrustBadge(
  input: SuggestTrustBadgeInput
): Promise<SuggestTrustBadgeOutput> {
  const { output } = await prompt(input);
  return output!; // { badge: 'Gold', reason: 'All documents...' }
}
```

### Error Handling

```typescript
// AI flows are OPTIONAL - don't block listing creation
try {
  imageAnalysisResult = await analyzePropertyImage({ imageDataUri });
} catch (e) {
  console.error('Image analysis failed:', e);
  // Don't throw - proceed without analysis
}

// User gets feedback about what succeeded/failed
if (imageAnalysisResult) {
  // Success - include in listing
}
```

---

## Database Schema

### Collections & Structure

#### `/users/{userId}` - User Profiles
```typescript
{
  uid: string;           // Firebase Auth UID
  email: string;
  displayName: string | null;
  photoURL: string | null;
  phone: string | null;
  bio: string | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  createdAt: Timestamp;
  verified: boolean;
  
  // Subcollections:
  // /favorites/{listingId}
  // /savedSearches/{searchId}
}
```

#### `/listings/{listingId}` - Property Listings
```typescript
{
  id: string;
  ownerId: string;              // Seller's UID
  title: string;
  description: string;
  price: number;                // In KES or local currency
  location: string;             // Display location
  county: string;               // Region
  area: number;                 // In acres/sq meters
  size: string;                 // "50x100 ft"
  landType: string;             // "Agricultural", "Residential"
  latitude: number;
  longitude: number;
  isApproximateLocation: boolean;
  
  status: 'pending' | 'approved' | 'rejected';
  badge: 'Gold' | 'Silver' | 'Bronze' | 'None' | null;
  
  seller: {
    name: string;
    avatarUrl: string;
  };
  
  images: {
    url: string;
    hint: string; // "custom upload" or "placeholder"
  }[];
  
  imageAnalysis?: {
    isSuspicious: boolean;
    reason: string;
  };
  
  badgeSuggestion?: {
    badge: BadgeValue;
    reason: string;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  adminReviewedAt?: Timestamp;
}
```

#### `/evidence/{evidenceId}` - Supporting Documents
```typescript
{
  id: string;
  listingId: string;           // Parent listing
  ownerId: string;             // Document uploader (seller)
  type: 'title_deed' | 'survey_map' | 'other';
  name: string;                // Original filename
  storagePath: string;         // GCS path
  uploadedAt: Timestamp;
  content: string;             // OCR'd text (for AI analysis)
  summary?: string;            // AI-generated summary
  verified: boolean;           // Admin review flag
  url?: string;                // Signed URL (15-min expiry, generated on fetch)
}
```

#### `/conversations/{conversationId}` - Messaging
```typescript
{
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  participantIds: string[];    // [buyerId, sellerId]
  participants: {
    [userId: string]: {
      displayName: string;
      photoURL: string;
    };
  };
  lastMessage: {
    text: string;
    timestamp: Timestamp;
    senderId: string;
  } | null;
  updatedAt: Timestamp;
  status?: 'new' | 'responded' | 'closed';
  
  // Subcollection:
  // /messages/{messageId}
  //   - senderId, text, timestamp (Timestamp)
}
```

#### `/adminConfig/settings` - Platform Configuration
```typescript
{
  id: 'settings';              // Doc ID is always 'settings'
  platformName: string;
  contactEmail: string;
  supportEmail: string;
  supportPhone?: string;
  siteDescription: string;
  maxUploadSizeMB: number;
  moderationThresholdDays: number;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  enableUserSignups: boolean;
  enableListingCreation: boolean;
  socialFacebook?: string;
  socialTwitter?: string;
  socialLinkedin?: string;
  trustStats?: {
    totalListings: number;
    totalBuyers: number;
    fraudCasesResolved: number;
  };
  updatedAt?: Timestamp;
  updatedBy?: string;           // Admin UID who last updated
}
```

#### `/auditLogs/{logId}` - Admin Action Trail
```typescript
{
  id: string;
  adminId: string;
  action: string;              // "approved_listing", "assigned_badge", etc.
  entityType: string;          // "listing", "user", "settings"
  entityId?: string;
  changes?: Record<string, any>;
  timestamp: Timestamp;
}
```

### Indexes

Critical indexes to create in Firebase Console:

```
Composite Indexes:
1. /listings: status + createdAt (for listing feed)
2. /conversations: participantIds + updatedAt (for user conversations)
3. /evidence: listingId + uploadedAt (for listing evidence)
4. /users: role + createdAt (for admin analytics)
```

---

## Key Patterns & Conventions

### Type-Safe Development

**All types in one file:** `src/lib/types.ts`

```typescript
// ✅ DO - Use central types
import type { Listing, UserProfile, Evidence } from '@/lib/types';

// ❌ DON'T - Define types inline
type MyListing = { id: string; ... };
```

### Path Aliases

Use `@/` for clean imports:

```typescript
// ✅ DO
import { getTrustBadge } from '@/lib/utils';
import type { Listing } from '@/lib/types';

// ❌ DON'T
import getTrustBadge from '../../../lib/utils';
import type Listing from '../../../../types';
```

### Component Organization

```
src/components/
├── buyer/              ← Landing, header, footer (BuyerHeader, BuyerFooter)
├── seller/             ← Workspace nav (SellerNav)
├── admin/              ← Workspace nav (AdminNav)
├── ui/                 ← Shadcn primitives (Button, Card, Dialog, etc.)
├── chat/               ← Messaging components
├── trust-badge.tsx    ← Shared (used everywhere)
└── [component].tsx    ← Shared utilities
```

### Form Validation Pattern

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// 1. Define schema
const listingSchema = z.object({
  title: z.string().min(5),
  price: z.number().positive(),
});

// 2. Use in component
const form = useForm({
  resolver: zodResolver(listingSchema),
  defaultValues: { /* ... */ }
});

// 3. Handle submission
const onSubmit = async (data) => {
  const result = await createListing(data);
};
```

### Error Handling Strategy

```typescript
// 1. Network errors allowed in dev (Firebase might be down)
const isNetworkError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : '';
  return message.includes('EAI_AGAIN') || 
         message.includes('getaddrinfo');
};

if (isDev && isNetworkError(error)) {
  // Allow navigation to continue
  return NextResponse.next();
}

// 2. Permission errors → redirect to /denied
// 3. Auth errors → redirect to /login?redirect=<path>
```

### Styling & Design System

**Color Palette** (from `tailwind.config.ts`):

```typescript
primary: '#0F3D2E'        // Deep Green (trust, land)
secondary: '#F4F1EC'      // Warm Sand (backgrounds)
accent: '#2F6F95'         // Muted Blue (actions)
warning: '#C58B2E'        // Amber (incomplete evidence)
destructive: '#8C2F39'    // Muted Red (suspicious)
success: '#22C55E'        // Green (approved)
```

**Badge Variants:**
```typescript
gold: "bg-yellow-400/20 text-yellow-700"
silver: "bg-slate-400/20 text-slate-700"
bronze: "bg-amber-600/20 text-amber-800"
```

---

## Development Workflow

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Environment variables (.env)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... (see .env.example or copilot-instructions.md)

# 3. Add serviceAccountKey.json (for server features)
# Download from Firebase Console → Project Settings

# 4. Start dev environment
npm run dev                # Main dev server (port 9002)
npm run genkit:dev         # In another terminal (AI flows)
```

### Development Commands

```bash
npm run dev              # Start dev server (Turbopack)
npm run genkit:dev       # Start Genkit AI flows
npm run genkit:watch     # Genkit with hot reload
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm run db:seed          # Seed sample data
npm run seed:settings    # Seed admin settings
```

### Debugging Tips

1. **Auth Issues:**
   - Check `__session` cookie in DevTools
   - Verify `serviceAccountKey.json` in project root
   - Check Firestore rules in Firebase Console

2. **Image/File Upload Issues:**
   - Verify Firebase Storage bucket exists
   - Check storage.rules for public write permissions
   - View uploads in Firebase Console → Storage

3. **AI Flow Issues:**
   - Check `npm run genkit:dev` is running
   - Verify Google AI API key in `.env`
   - Test flows in Genkit UI (usually http://localhost:4000)

4. **Data Not Appearing:**
   - Check Firestore rules allow your user role
   - Verify data was actually created (check Firebase Console)
   - Check `revalidatePath()` calls after mutations

---

## Performance & Deployment

### Optimization Strategies

1. **Turbopack** (in dev) → 3x faster Hot Module Replacement
2. **ISR (Incremental Static Regeneration)** → Revalidate paths on mutation
3. **Signed URLs** for evidence documents (15-min expiry, no auth needed)
4. **Image Optimization** via Next.js `<Image>` component
5. **Pagination** in listing pages (12 items at a time)
6. **React Query-style Patterns** for data freshness

### Caching Strategy

```typescript
// Revalidate on demand after mutations
revalidatePath('/')                    // Home page
revalidatePath('/dashboard')           // Seller dashboard
revalidatePath('/admin')               // Admin dashboard

// Combined:
Promise.all([
  revalidatePath('/'),
  revalidatePath('/dashboard'),
  revalidatePath('/admin')
]);
```

### Deployment Targets

**Recommended:** Vercel (seamless Next.js + Firebase integration)

**Also Possible:**
- Firebase App Hosting (managed Next.js)
- Google Cloud Run (containerized)
- Any Node.js host (AWS, Azure, self-hosted)

**Environment Variables on Deploy:**
```
1. FIREBASE_SERVICE_ACCOUNT_KEY_B64 ← Use this
   (Set via Vercel/deployment platform env vars)

2. ALternatively: FIREBASE_* individual vars
   (Export from serviceAccountKey.json)
```

### Database Limits & Quotas

**Firestore (Free Tier):**
- 50K reads/day
- 20K writes/day
- 20K deletes/day
- 1GB storage

**Upgrade to Blaze (pay-per-use) for production.**

---

## Domain Expertise Summary

### What Makes This Project Interesting

1. **Trust System First** - Badge assignment is central to marketplace viability
2. **AI-Powered Evidence** - OCR + NLP for document analysis
3. **Role-Based Everything** - Different UIs for buyer/seller/admin
4. **Hybrid Auth** - Firebase Auth + custom session cookies
5. **Production-Ready** - Security rules, error handling, optimization

### Common Pitfalls to Avoid

1. **Calling Firebase from Client** → Use server actions instead
2. **Forgetting `revalidatePath()`** → Stale data issues
3. **Listing status without admin check** → Security hole
4. **Evidence without ownerId** → Firestore rules reject
5. **Using `__session` carelessly** → Always verify on server

### Next Steps for Contributors

- [ ] Add tests (currently none exist)
- [ ] Implement CI/CD pipeline
- [ ] Add rate limiting on API routes
- [ ] Expand AI flows (more document types)
- [ ] Analytics dashboard improvements
- [ ] Mobile app (React Native / Expo)

---

## Quick Reference

### NPM Scripts
```bash
dev               # Dev server on port 9002
build             # Production build
lint              # ESLint
typecheck         # TypeScript strict check
db:seed           # Seed sample data
seed:settings     # Seed admin config
```

### Key Files
- **Auth:** `src/middleware.ts`, `src/lib/firebase.ts`, `src/lib/firebase-admin.ts`
- **Data:** `src/lib/data.ts`, `src/app/actions.ts`
- **Types:** `src/lib/types.ts`
- **Rules:** `firestore.rules`, `storage.rules`
- **AI:** `src/ai/flows/`, `src/ai/genkit.ts`

### Useful Links
- [Firebase Console](https://console.firebase.google.com/project/kenya-land-trust)
- [Genkit Docs](https://firebase.google.com/docs/genkit)
- [Next.js Docs](https://nextjs.org/docs)
- [Shadcn/UI Components](https://ui.shadcn.com/)

---

**Generated:** February 2026  
**Maintainer:** Kenya Land Trust Dev Team
