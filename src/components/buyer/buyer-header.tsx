'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
  LandPlot,
  LogOut,
  UserCircle,
  Menu,
  Heart,
  MessageSquare,
  LayoutDashboard,
  Settings,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers';
import { auth } from '@/lib/firebase';
import { Sheet, SheetContent, SheetClose, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export function BuyerHeader() {
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const isSeller = userProfile?.role === 'SELLER' || userProfile?.role === 'ADMIN';

  const handleLogout = async () => {
    await auth.signOut();
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { href: '/#listings-section', label: 'Browse Listings' },
    { href: '/trust', label: 'How It Works' },
    { href: '/contact', label: 'About' },
  ];

  const dashboardUrl = isSeller ? '/dashboard' : '/buyer/dashboard';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center gap-4">
        <Link href="/" className="mr-2 flex shrink-0 items-center space-x-2">
          <LandPlot className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">Kenya Land Trust</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-6 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative font-medium transition-colors hover:text-foreground/80',
                pathname === link.href ? 'text-foreground' : 'text-foreground/60',
              )}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : user && userProfile ? (
            <>
              <Button asChild className="hidden lg:inline-flex" variant="outline" size="sm">
                <Link href={dashboardUrl}>Dashboard</Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0" aria-label="Open user menu">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={userProfile?.photoURL ?? undefined} alt={userProfile?.displayName ?? ''} />
                      <AvatarFallback>{userProfile?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile?.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userProfile.role.charAt(0) + userProfile.role.slice(1).toLowerCase()} Account
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href={dashboardUrl}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/favorites">
                      <Heart className="mr-2 h-4 w-4" />
                      Favorites
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/messages">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Messages
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
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
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">List Your Land</Link>
              </Button>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm p-0">
              <SheetHeader className="border-b px-4 py-3">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="flex max-h-[calc(100dvh-76px)] flex-col overflow-y-auto px-4 py-4">
                {user && userProfile && (
                  <div className="mb-6">
                    <div className="mb-4 flex items-center gap-3 px-3 py-2">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={userProfile?.photoURL ?? undefined} alt={userProfile?.displayName ?? ''} />
                        <AvatarFallback className="text-lg font-bold">
                          {userProfile?.displayName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{userProfile?.displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">{userProfile?.email}</p>
                        <p className="mt-1 text-xs font-medium text-primary">{userProfile?.role}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <SheetClose asChild>
                        <Link href={dashboardUrl} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent/50">
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </SheetClose>
                      {isSeller && (
                        <SheetClose asChild>
                          <Link href="/dashboard/listings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent/50">
                            <PlusCircle className="h-4 w-4" />
                            My Listings
                          </Link>
                        </SheetClose>
                      )}
                      <SheetClose asChild>
                        <Link href="/messages" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent/50">
                          <MessageSquare className="h-4 w-4" />
                          Messages
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/favorites" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent/50">
                          <Heart className="h-4 w-4" />
                          Saved Properties
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent/50">
                          <UserCircle className="h-4 w-4" />
                          Profile
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent/50">
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </SheetClose>
                    </div>
                  </div>
                )}

                <div className="space-y-1 border-t pt-4">
                  {navLinks.map((link) => (
                    <SheetClose key={link.href} asChild>
                      <Link
                        href={link.href}
                        className={cn(
                          'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          pathname === link.href
                            ? 'bg-accent text-accent-foreground'
                            : 'text-foreground/70 hover:bg-accent/50 hover:text-foreground',
                        )}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </div>

                <div className="mt-6 border-t px-2 pt-4">
                  {user && userProfile ? (
                    <SheetClose asChild>
                      <Button variant="outline" onClick={handleLogout} className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </SheetClose>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <SheetClose asChild>
                        <Button variant="outline" asChild>
                          <Link href="/login">Sign In</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild>
                          <Link href="/signup">List Your Land</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
