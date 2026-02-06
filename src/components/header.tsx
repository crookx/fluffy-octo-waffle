'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { LandPlot, LayoutDashboard, LogOut, PlusCircle, MessageSquare, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers';
import { auth, db } from '@/lib/firebase';
import {
  Sheet,
  SheetContent,
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


export function Header() {
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (userProfile?.role !== 'ADMIN') return;

    const q = query(collection(db, "listings"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setPendingCount(snapshot.size);
    }, (error) => {
      console.error("Failed to listen for pending listings:", error);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleLogout = async () => {
    await auth.signOut();
    // Signal backend to clear the session cookie
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    // Conditionally show Admin link
    ...(userProfile?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin' }] : []),
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
                {link.label === 'Admin' && pendingCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-4 h-5 w-5 justify-center p-0">{pendingCount}</Badge>
              )}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-2">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              {user ? (
                <>
                  <Button asChild className="hidden sm:inline-flex">
                    <Link href="/listings/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Listing
                    </Link>
                  </Button>
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
                        <DropdownMenuItem asChild>
                             <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                        </DropdownMenuItem>
                         <DropdownMenuItem asChild>
                             <Link href="/messages"><MessageSquare className="mr-2 h-4 w-4" />Messages</Link>
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
                  <Button variant="ghost" asChild className="hidden sm:inline-flex">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button variant="accent" asChild className="hidden sm:inline-flex">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          'text-sm font-medium',
                          pathname === link.href ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {link.label}
                        {link.label === 'Admin' && pendingCount > 0 && (
                          <Badge variant="destructive" className="ml-2 h-5 w-5 justify-center p-0">
                            {pendingCount}
                          </Badge>
                        )}
                      </Link>
                    ))}
                    {user ? (
                      <>
                        <Link href="/listings/new" className="text-sm font-medium">
                          New Listing
                        </Link>
                        <Link href="/dashboard" className="text-sm font-medium">
                          Dashboard
                        </Link>
                        <Link href="/messages" className="text-sm font-medium">
                          Messages
                        </Link>
                        <Button variant="outline" onClick={handleLogout}>
                          Log out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="text-sm font-medium">
                          Log in
                        </Link>
                        <Link href="/signup" className="text-sm font-medium">
                          Sign Up
                        </Link>
                      </>
                    )}
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
