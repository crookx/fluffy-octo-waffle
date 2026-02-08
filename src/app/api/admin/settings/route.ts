import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { PlatformSettings, AuditLog } from '@/lib/types';

// Validation schema for platform settings
const SettingsSchema = z.object({
  platformName: z.string().min(1, 'Platform name is required').max(100),
  contactEmail: z.string().email('Invalid contact email'),
  supportEmail: z.string().email('Invalid support email'),
  supportPhone: z.string().optional().default(''),
  siteDescription: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  maxUploadSizeMB: z.number().min(1, 'Max upload size must be at least 1 MB').max(1000),
  moderationThresholdDays: z.number().min(1, 'Must be at least 1 day').max(365),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional().default(''),
  enableUserSignups: z.boolean(),
  enableListingCreation: z.boolean(),
  socialFacebook: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  socialTwitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  socialLinkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  trustStats: z.object({
    totalListings: z.number().min(0),
    totalBuyers: z.number().min(0),
    fraudCasesResolved: z.number().min(0),
  }).optional(),
});

type SettingsValidationInput = z.infer<typeof SettingsSchema>;

/**
 * Helper function to verify admin role
 */
async function verifyAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value;
  
  if (!sessionCookie) {
    return { authenticated: false, error: 'Authentication required', status: 401, uid: undefined };
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userRole = userDoc.exists ? userDoc.data()?.role : null;

    if (userRole !== 'ADMIN') {
      return { authenticated: false, error: 'Authorization required: Only admins can access settings', status: 403, uid: undefined };
    }

    return { authenticated: true, uid: decodedToken.uid, status: 200 };
  } catch (error: any) {
    console.error('/api/admin/settings: Session verification failed:', error?.message);
    return { authenticated: false, error: 'Session verification failed', status: 401, uid: undefined };
  }
}

/**
 * Log changes to audit collection
 */
async function logAudit(
  adminId: string,
  action: string,
  entityType: string,
  changes: Record<string, any>,
  entityId?: string
) {
  try {
    const auditEntry: AuditLog = {
      adminId,
      action,
      entityType,
      entityId,
      changes,
      timestamp: FieldValue.serverTimestamp(),
    };
    await adminDb.collection('auditLogs').add(auditEntry as any);
  } catch (error: any) {
    console.warn('Failed to log audit entry:', error?.message);
    // Don't fail the request if audit logging fails, but log the error
  }
}

/**
 * GET /api/admin/settings
 * Retrieve current platform settings
 */
export async function GET(request: NextRequest) {
  try {
    const verifyResult = await verifyAdmin(request);
    if (!verifyResult.authenticated) {
      return NextResponse.json(
        { status: 'error', message: verifyResult.error },
        { status: verifyResult.status }
      );
    }

    const settingsDoc = await adminDb.collection('adminConfig').doc('settings').get();

    if (!settingsDoc.exists) {
      // Return default settings if not found
      const defaultSettings: PlatformSettings = {
        platformName: 'Kenya Land Trust',
        contactEmail: 'contact@kenyalandtrust.com',
        supportEmail: 'support@kenyalandtrust.com',
        siteDescription: 'A trusted platform for buying and selling land in Kenya',
        maxUploadSizeMB: 50,
        moderationThresholdDays: 7,
        maintenanceMode: false,
        maintenanceMessage: '',
        enableUserSignups: true,
        enableListingCreation: true,
      };
      return NextResponse.json({ status: 'success', data: defaultSettings });
    }

    const settings = settingsDoc.data() as PlatformSettings;
    return NextResponse.json({ status: 'success', data: settings });
  } catch (error: any) {
    console.error('/api/admin/settings GET error:', error?.message);
    return NextResponse.json(
      { status: 'error', message: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings
 * Update platform settings with validation and audit logging
 */
export async function PATCH(request: NextRequest) {
  try {
    const verifyResult = await verifyAdmin(request);
    if (!verifyResult.authenticated) {
      return NextResponse.json(
        { status: 'error', message: verifyResult.error },
        { status: verifyResult.status }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = SettingsSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return NextResponse.json(
        { status: 'error', message: 'Validation failed', errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data as SettingsValidationInput;

    // Fetch current settings to track changes
    const settingsDoc = await adminDb.collection('adminConfig').doc('settings').get();
    const currentSettings = settingsDoc.exists ? settingsDoc.data() : {};

    // Build update object with metadata
    const updateData = {
      ...validatedData,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: verifyResult.uid || '',
    };

    // Save settings
    await adminDb.collection('adminConfig').doc('settings').set(updateData, { merge: true });

    // Log the audit entry with change tracking
    const changes: Record<string, any> = {};
    Object.entries(validatedData).forEach(([key, value]) => {
      if ((currentSettings as Record<string, any>)[key] !== value) {
        changes[key] = {
          old: (currentSettings as Record<string, any>)[key],
          new: value,
        };
      }
    });

    if (Object.keys(changes).length > 0 && verifyResult.uid) {
      await logAudit(verifyResult.uid, 'UPDATE', 'platform_settings', changes, 'settings');
    }

    // Revalidate relevant paths
    revalidatePath('/admin');
    revalidatePath('/admin/settings');

    return NextResponse.json({
      status: 'success',
      message: 'Settings updated successfully',
      data: updateData,
    });
  } catch (error: any) {
    console.error('/api/admin/settings PATCH error:', error?.message);
    return NextResponse.json(
      { status: 'error', message: error?.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
