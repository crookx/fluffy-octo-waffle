'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LandPlot, LayoutDashboard, MessageSquare, User, Settings, List } from 'lucide-react';
import { useAuth } from '@/components/providers';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/listings', label: 'Listings', icon: List },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function SellerNav() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const isListingsActive =
    pathname === '/dashboard/listings' ||
    pathname.startsWith('/dashboard/listings/') ||
    pathname === '/listings/new' ||
    pathname.endsWith('/edit');

  return (
    <>
      <SidebarHeader className="pb-2">
        <Link href="/" className="flex items-center gap-2">
          <LandPlot className="size-6 text-primary" />
          <h2 className="text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Kenya Land Trust
          </h2>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="gap-1">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={
                    item.href === '/dashboard/listings'
                      ? isListingsActive
                      : pathname === item.href || pathname.startsWith(`${item.href}/`)
                  }
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2" />
        {userProfile && (
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userProfile.photoURL ?? undefined} alt={userProfile.displayName ?? ''} />
              <AvatarFallback>{userProfile.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium leading-tight truncate">{userProfile.displayName}</span>
              <span className="text-xs text-muted-foreground leading-snug truncate">{userProfile.email}</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </>
  );
}
