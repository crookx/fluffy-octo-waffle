'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';
import {
  LandPlot,
  LayoutDashboard,
  Inbox,
  LogOut,
  User,
  List,
  AreaChart,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers';
import { auth, db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { Badge } from '@/components/ui/badge';

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    if (userProfile?.role !== 'ADMIN') return;

    const listingsQuery = query(collection(db, 'listings'), where('status', '==', 'pending'));
    const listingsUnsubscribe = onSnapshot(listingsQuery, (snapshot) => {
      setPendingCount(snapshot.size);
    },
    async (error) => {
        const permissionError = new FirestorePermissionError({
            path: '/listings',
            operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
    });

    const contactQuery = query(collection(db, 'contactMessages'), where('status', '==', 'new'));
    const reportsQuery = query(collection(db, 'listingReports'), where('status', '==', 'new'));
    
    let contactCount = 0;
    let reportCount = 0;

    const contactUnsubscribe = onSnapshot(contactQuery, (snapshot) => {
        contactCount = snapshot.size;
        setInboxCount(contactCount + reportCount);
    }, async (error) => {
        const permissionError = new FirestorePermissionError({
            path: '/contactMessages',
            operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
    });

    const reportsUnsubscribe = onSnapshot(reportsQuery, (snapshot) => {
        reportCount = snapshot.size;
        setInboxCount(contactCount + reportCount);
    }, async (error) => {
        const permissionError = new FirestorePermissionError({
            path: '/listingReports',
            operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
    });

    return () => {
      listingsUnsubscribe();
      contactUnsubscribe();
      reportsUnsubscribe();
    };
  }, [userProfile]);

  const handleLogout = async () => {
    await auth.signOut();
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/listings', label: 'Listings', icon: List, badge: pendingCount > 0 ? pendingCount : undefined },
    { href: '/admin/inbox', label: 'Inbox', icon: Inbox, badge: inboxCount > 0 ? inboxCount : undefined },
    { href: '/admin/analytics', label: 'Analytics', icon: AreaChart },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <LandPlot className="size-6 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Kenya Land Trust
          </h2>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));

            return (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton isActive={isActive} tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                    {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2" />
         {userProfile && (
            <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.photoURL ?? undefined} alt={userProfile?.displayName ?? ''} />
                    <AvatarFallback>{userProfile?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{userProfile.displayName}</span>
                      <Badge variant="secondary" className="h-5">Admin</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{userProfile.email}</span>
                </div>
            </div>
         )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Log out">
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
