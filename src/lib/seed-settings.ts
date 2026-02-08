/**
 * Admin Settings Initialization Script
 * 
 * This script initializes the admin platform settings document in Firestore.
 * Run with: npm run seed:settings
 */

import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { PlatformSettings } from './types';

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'Kenya Land Trust',
  contactEmail: 'contact@kenyalandtrust.com',
  supportEmail: 'support@kenyalandtrust.com',
  supportPhone: '+254 (0) 700 000 000',
  siteDescription: 'A trusted platform for buying and selling land in Kenya with verified listings and secure transactions.',
  maxUploadSizeMB: 50,
  moderationThresholdDays: 30,
  maintenanceMode: false,
  maintenanceMessage: '',
  enableUserSignups: true,
  enableListingCreation: true,
  socialFacebook: 'https://facebook.com/kenyalandtrust',
  socialTwitter: 'https://twitter.com/kenyalandtrust',
  socialLinkedin: 'https://linkedin.com/company/kenyalandtrust',
  trustStats: {
    totalListings: 10000,
    totalBuyers: 5000,
    fraudCasesResolved: 0,
  },
  updatedAt: FieldValue.serverTimestamp(),
  updatedBy: 'system-init',
};

async function initializeSettings() {
  try {
    console.log('🚀 Starting platform settings initialization...\n');

    // Check if settings already exist
    const settingsDoc = await adminDb.collection('adminConfig').doc('settings').get();

    if (settingsDoc.exists) {
      console.log('✅ Settings document already exists.');
      console.log('Current settings:');
      console.log(JSON.stringify(settingsDoc.data(), null, 2));
      console.log(
        '\n💡 To reset to defaults, delete the document in Firestore Console and run this script again.'
      );
      return;
    }

    // Create settings document
    await adminDb.collection('adminConfig').doc('settings').set(DEFAULT_SETTINGS as any);

    console.log('✅ Platform settings initialized successfully!\n');
    console.log('📋 Initialized with the following settings:');
    console.log(JSON.stringify(DEFAULT_SETTINGS, null, 2));
    console.log('\n✨ The admin settings page is now ready to use at /admin/settings');
  } catch (error: any) {
    console.error('❌ Error initializing settings:', error?.message || error);
    process.exit(1);
  }
}

initializeSettings().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
});
