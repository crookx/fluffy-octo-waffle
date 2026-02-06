'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { LandPlot, LayoutDashboard, LogOut, PlusCircle, MessageSquare, UserCircle, Menu, Heart, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers';
import { auth, db } from '@/lib/firebase';
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from './ui/skeleton';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';


export function Header() {
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [pendingCount, setPendingCount] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);

  const isSellerOrAdmin = userProfile?.role === 'SELLER' || userProfile?.role === 'ADMIN';

  useEffect(() => {
    if (userProfile?.role !== 'ADMIN') {
        setPendingCount(0);
        setInboxCount(0);
        return;
    };

    const listingsQuery = query(collection(db, 'listings'), where('status', '==', 'pending'));
    const listingsUnsubscribe = onSnapshot(listingsQuery, (snapshot) => {
      setPendingCount(snapshot.size);
    });

    const contactQuery = query(collection(db, 'contactMessages'), where('status', '==', 'new'));
    const reportsQuery = query(collection(db, 'listingReports'), where('status', '==', 'new'));
    
    let contactCount = 0;
    let reportCount = 0;

    const contactUnsubscribe = onSnapshot(contactQuery, (snapshot) => {
        contactCount = snapshot.size;
        setInboxCount(contactCount + reportCount);
    });

    const reportsUnsubscribe = onSnapshot(reportsQuery, (snapshot) => {
        reportCount = snapshot.size;
        setInboxCount(contactCount + reportCount);
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
  
  // Hide header on all admin routes, as they use a dedicated layout
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    // Admin link is removed, it now lives in the dedicated admin sidebar.
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <LandPlot className="h-6 w-6 text-primary" />
          <span className="font-bold hidden sm:inline-block">
            Kenya Land Trust
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors hover:text-foreground/80 relative',
                pathname === link.href
                  ? 'text-foreground'
                  : 'text-foreground/60'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-2">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              {user && userProfile ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="Open user menu">
                        <Avatar className="h-8 w-8">
                           <AvatarImage src={userProfile?.photoURL ?? undefined} alt={userProfile?.displayName ?? ''} />
                           <AvatarFallback>{userProfile?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{userProfile?.displayName}</p>
                                <p className="text-xs leading-none text-muted-foreground">{userProfile?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {userProfile.role === 'ADMIN' && (
                            <DropdownMenuItem asChild>
                                <Link href="/admin" className="flex items-center justify-between">
                                  <span><LayoutDashboard className="mr-2 h-4 w-4 inline-block align-middle"/>Admin Panel</span>
                                  {pendingCount > 0 && <Badge variant="warning">{pendingCount}</Badge>}
                                </Link>
                            </DropdownMenuItem>
                        )}
                        {isSellerOrAdmin && (
                          <DropdownMenuItem asChild>
                               <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                          </DropdownMenuItem>
                        )}
                        {isSellerOrAdmin && (
                            <DropdownMenuItem asChild>
                                <Link href="/listings/new"><PlusCircle className="mr-2 h-4 w-4" />New Listing</Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                             <Link href="/favorites"><Heart className="mr-2 h-4 w-4" />Favorites</Link>
                        </DropdownMenuItem>
                         <DropdownMenuItem asChild>
                              {userProfile.role === 'ADMIN' ? (
                                <Link href="/admin/inbox" className="flex items-center justify-between">
                                    <span><Inbox className="mr-2 h-4 w-4 inline-block align-middle"/>Inbox</span>
                                    {inboxCount > 0 && <Badge variant="warning">{inboxCount}</Badge>}
                                </Link>
                              ) : (
                                <Link href="/messages"><MessageSquare className="mr-2 h-4 w-4" />Messages</Link>
                              )}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                             <Link href="/profile"><UserCircle className="mr-2 h-4 w-4" />Manage Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="hidden md:inline-flex">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button variant="accent" asChild className="hidden md:inline-flex">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-sm">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex h-full flex-col">
                    <div className="flex flex-col gap-4">
                        <SheetClose asChild>
                            <Link href="/" className={cn('text-sm font-medium', pathname === '/' ? 'text-foreground' : 'text-muted-foreground')}>Home</Link>
                        </SheetClose>

                        {user && userProfile ? (
                        <>
                            {userProfile.role === 'ADMIN' && (
                                <SheetClose asChild>
                                    <Link href="/admin" className={cn('text-sm font-medium flex items-center justify-between', pathname.startsWith('/admin') ? 'text-foreground' : 'text-muted-foreground')}>
                                        <span><LayoutDashboard className="mr-2 h-4 w-4 inline"/> Admin Panel</span>
                                        {pendingCount > 0 && <Badge variant="warning">{pendingCount}</Badge>}
                                    </Link>
                                </SheetClose>
                            )}
                            {isSellerOrAdmin && (
                                <>
                                    <SheetClose asChild><Link href="/dashboard" className={cn('text-sm font-medium flex items-center', pathname === '/dashboard' ? 'text-foreground' : 'text-muted-foreground')}><LayoutDashboard className="mr-2 h-4 w-4"/>Dashboard</Link></SheetClose>
                                    <SheetClose asChild><Link href="/listings/new" className={cn('text-sm font-medium flex items-center', pathname === '/listings/new' ? 'text-foreground' : 'text-muted-foreground')}><PlusCircle className="mr-2 h-4 w-4"/>New Listing</Link></SheetClose>
                                </>
                            )}
                            <SheetClose asChild><Link href="/favorites" className={cn('text-sm font-medium flex items-center', pathname === '/favorites' ? 'text-foreground' : 'text-muted-foreground')}><Heart className="mr-2 h-4 w-4"/>Favorites</Link></SheetClose>
                            <SheetClose asChild>
                                {userProfile.role === 'ADMIN' ? (
                                    <Link href="/admin/inbox" className={cn('text-sm font-medium flex items-center justify-between', pathname.startsWith('/admin/inbox') ? 'text-foreground' : 'text-muted-foreground')}>
                                        <span><Inbox className="mr-2 h-4 w-4 inline"/> Inbox</span>
                                        {inboxCount > 0 && <Badge variant="warning">{inboxCount}</Badge>}
                                    </Link>
                                ) : (
                                    <Link href="/messages" className={cn('text-sm font-medium flex items-center', pathname.startsWith('/messages') ? 'text-foreground' : 'text-muted-foreground')}><MessageSquare className="mr-2 h-4 w-4"/>Messages</Link>
                                )}
                            </SheetClose>
                            <SheetClose asChild><Link href="/profile" className={cn('text-sm font-medium flex items-center', pathname === '/profile' ? 'text-foreground' : 'text-muted-foreground')}><UserCircle className="mr-2 h-4 w-4"/>Manage Profile</Link></SheetClose>
                        </>
                        ) : null}
                    </div>

                    <div className="mt-auto pt-6">
                        <Separator className="mb-4" />
                        {user ? (
                            <SheetClose asChild>
                                <Button variant="outline" onClick={handleLogout} className="w-full">Log out</Button>
                            </SheetClose>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <SheetClose asChild><Button asChild variant="outline" className="w-full"><Link href="/login">Log In</Link></Button></SheetClose>
                                <SheetClose asChild><Button asChild variant="accent" className="w-full"><Link href="/signup">Sign Up</Link></Button></SheetClose>
                            </div>
                        )}
                    </div>

                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
