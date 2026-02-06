import { adminAuth, adminDb } from './firebase-admin';
import { faker } from '@faker-js/faker';
import { PlaceHolderImages } from './placeholder-images';
import type { UserProfile, BadgeValue, ListingStatus, ListingImage } from './types';
import { FieldValue } from 'firebase-admin/firestore';

const SEED_USERS = [
    { email: 'seller1@example.com', displayName: 'Amani Properties', role: 'SELLER' as const },
    { email: 'seller2@example.com', displayName: 'Baraka Lands', role: 'SELLER' as const },
    { email: 'admin@example.com', displayName: 'Admin User', role: 'ADMIN' as const },
];
const SEED_PASSWORD = 'password123';
const LISTING_COUNT = 12;

const COUNTIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Kajiado", "Machakos", "Kiambu", "Uasin Gishu"];
const LOCATIONS_BY_COUNTY: Record<string, string[]> = {
    "Nairobi": ["Karen", "Runda", "Lavington", "Westlands"],
    "Mombasa": ["Nyali", "Bamburi", "Shanzu", "Diani"],
    "Kisumu": ["Milimani", "Riat Hills", "Mamboleo"],
    "Nakuru": ["Milimani", "Naka", "Lanet"],
    "Kajiado": ["Kitengela", "Isinya", "Ngong", "Rongai"],
    "Machakos": ["Syokimau", "Athi River", "Mlolongo"],
    "Kiambu": ["Ruiru", "Thika", "Kikuyu", "Juja"],
    "Uasin Gishu": ["Eldoret Town", "Kapsoya", "Elgon View"],
};

// Helper to pick a random item from an array
const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];


async function main() {
    console.log('--- Starting Database Seeding ---');

    // 1. Create or Update Users
    console.log('\nCreating seed users...');
    const userRecords: UserProfile[] = [];

    for (const userData of SEED_USERS) {
        try {
            let userRecord = await adminAuth.getUserByEmail(userData.email).catch(() => null);
            let uid: string;

            if (userRecord) {
                uid = userRecord.uid;
                console.log(`User ${userData.email} already exists. Updating...`);
                await adminAuth.updateUser(uid, {
                    displayName: userData.displayName,
                    password: SEED_PASSWORD,
                });
            } else {
                const newUser = await adminAuth.createUser({
                    email: userData.email,
                    password: SEED_PASSWORD,
                    displayName: userData.displayName,
                    emailVerified: true,
                });
                uid = newUser.uid;
                console.log(`Created new user: ${userData.email}`);
            }

            const userProfile: UserProfile = {
                uid: uid,
                email: userData.email,
                displayName: userData.displayName,
                role: userData.role,
                createdAt: FieldValue.serverTimestamp(),
                photoURL: `https://i.pravatar.cc/150?u=${uid}`,
                phone: faker.phone.number(),
                verified: true,
            };

            await adminDb.collection('users').doc(uid).set(userProfile, { merge: true });
            userRecords.push(userProfile);
            console.log(`Upserted Firestore profile for ${userData.email}.`);
        } catch (error: any) {
            console.error(`Failed to process user ${userData.email}:`, error.message);
        }
    }
    console.log('User creation complete.');


    // 2. Clear existing listings before seeding
    console.log('\nDeleting all existing listings...');
    const allListings = await adminDb.collection('listings').get();
    if (allListings.size > 0) {
        const batch = adminDb.batch();
        allListings.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Deleted ${allListings.size} listings.`);
    } else {
        console.log('No existing listings to delete.');
    }

    // 3. Create Listings
    console.log('\nCreating seed listings...');
    const sellerUsers = userRecords.filter(u => u.role === 'SELLER');
    if(sellerUsers.length === 0) {
        console.error('No seller accounts available to assign listings to. Aborting.');
        return;
    }

    const listingBatch = adminDb.batch();

    for (let i = 0; i < LISTING_COUNT; i++) {
        const docRef = adminDb.collection('listings').doc();
        const owner = randomPick(sellerUsers);
        const county = randomPick(COUNTIES);
        const location = randomPick(LOCATIONS_BY_COUNTY[county]);
        const status = randomPick<ListingStatus>(['approved', 'approved', 'approved', 'pending', 'rejected']);
        
        // Use a placeholder image, ensuring it's a single-item array
        const placeholderImage = randomPick(PlaceHolderImages);
        const images: ListingImage[] = [{
            url: placeholderImage.imageUrl,
            hint: placeholderImage.imageHint,
        }];

        const newListing = {
            ownerId: owner.uid,
            title: `${faker.number.int({ min: 1, max: 20 })} Acres in ${location}`,
            location: location,
            county: county,
            price: faker.number.int({ min: 500000, max: 15000000 }),
            area: faker.number.int({ min: 1, max: 20 }),
            size: "100x100 ft",
            landType: randomPick(["Agricultural", "Residential", "Commercial"]),
            description: faker.lorem.paragraphs(3),
            status: status,
            images: images,
            badge: status === 'approved' ? randomPick<BadgeValue>(['Gold', 'Silver', 'Bronze', 'None']) : null,
            seller: {
                name: owner.displayName,
                avatarUrl: owner.photoURL,
            },
            badgeSuggestion: {
                badge: randomPick<BadgeValue>(['Gold', 'Silver', 'Bronze']),
                reason: faker.lorem.sentence(),
            },
            imageAnalysis: {
                isSuspicious: faker.datatype.boolean(0.1), // 10% chance of being suspicious
                reason: 'This appears to be a common stock photo.',
            },
            latitude: parseFloat(faker.location.latitude({ min: -4.7, max: 5.0, precision: 6 }).toString()),
            longitude: parseFloat(faker.location.longitude({ min: 34.0, max: 41.9, precision: 6 }).toString()),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        listingBatch.set(docRef, newListing);
    }
    
    await listingBatch.commit();
    console.log(`Created ${LISTING_COUNT} new listings.`);

    console.log('\n--- Database Seeding Complete ---');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
