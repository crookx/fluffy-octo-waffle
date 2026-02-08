import { getAuthenticatedUser, getSavedSearchesForUser, getFavoriteListingsForUser, getRecentConversationsForUser } from '@/app/actions';
import { redirect } from 'next/navigation';
import { BuyerPage } from '@/components/buyer/buyer-page';
import { BuyerDashboardClient } from '@/components/buyer/buyer-dashboard-client';

export const dynamic = 'force-dynamic';

export default async function BuyerDashboardPage() {
    const user = await getAuthenticatedUser();
    if (!user) {
        redirect('/login?redirect=/buyer/dashboard');
    }
    if (user.role === 'SELLER' || user.role === 'ADMIN') {
        redirect('/dashboard');
    }

    const [
        savedSearches,
        favoriteListings,
        recentConversations
    ] = await Promise.all([
        getSavedSearchesForUser(user.uid),
        getFavoriteListingsForUser(user.uid, 5),
        getRecentConversationsForUser(user.uid, 5)
    ]);
    
    return (
        <BuyerPage
            title="My Dashboard"
            description={`Welcome back, ${user.displayName || 'Buyer'}. Here's an overview of your activity.`}
        >
            <BuyerDashboardClient
                savedSearches={savedSearches}
                favoriteListings={favoriteListings}
                recentConversations={recentConversations}
            />
        </BuyerPage>
    );
}
