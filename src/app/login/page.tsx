'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, type User, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, LandPlot } from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

const formSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  rememberMe: z.boolean().default(true),
});

function getFirebaseAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please check your credentials and try again.';
        case 'auth/invalid-email':
            return 'The email address you entered is not valid.';
        case 'auth/user-disabled':
            return 'This user account has been disabled.';
        case 'auth/too-many-requests':
            return 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
        case 'auth/popup-closed-by-user':
            return 'The sign-in popup was closed before completing the sign-in. Please try again.';
        default:
            return `An unexpected server error occurred. Please try again. (Code: ${errorCode})`;
    }
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let isActive = true;
    const checkExistingSession = async () => {
      try {
        const response = await fetch('/api/auth/session', { method: 'GET', credentials: 'include' });
        if (!response.ok) return;
        const data = await response.json();
        if (!isActive || !data?.authenticated) return;
        const role = data.role ?? 'BUYER';
        const redirectTarget = role === 'ADMIN' ? '/admin' : role === 'SELLER' ? '/dashboard' : '/';
        router.replace(redirectTarget);
      } catch (error) {
        console.warn('[Login] Unable to check existing session:', error);
      }
    };
    checkExistingSession();
    return () => {
      isActive = false;
    };
  }, [router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });
  
  const handleLoginSuccess = async (user: User) => {
    try {
      console.log('[Login] Starting handleLoginSuccess for user:', user.uid);
      const idToken = await user.getIdToken();

      console.log('[Login] Got idToken, calling /api/auth/session');
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Could not parse error response from server.' }));
          throw new Error(errorData.message || 'Failed to create session on the server.');
      }

      console.log('[Login] Session cookie created, waiting 500ms for browser to process Set-Cookie');
      // Wait longer for the cookie to be fully set in the browser
      // The browser needs time to process the Set-Cookie header from the response
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify the session was actually created and is accessible
      console.log('[Login] Verifying session creation...');
      let sessionVerified = false;
      for (let i = 0; i < 5; i++) {
        try {
          const verifyResponse = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include', // Include cookies in the request
          });
          if (verifyResponse.ok) {
            console.log('[Login] Session verified on attempt', i + 1);
            sessionVerified = true;
            break;
          }
        } catch (err) {
          console.log('[Login] Session verification attempt', i + 1, 'failed');
        }
        if (i < 4) await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!sessionVerified) {
        console.warn('[Login] Session verification failed, but proceeding anyway');
      }

      // Wait another moment for good measure before navigation
      await new Promise(resolve => setTimeout(resolve, 200));

      toast({ title: 'Login Successful', description: "Welcome back!" });
      
      let fallbackRedirect = '/';
      let userRole = 'BUYER';
      try {
        console.log('[Login] Fetching user role from Firestore');
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        userRole = userDoc.exists() ? userDoc.data()?.role : 'BUYER';
        console.log('[Login] User role:', userRole);
        
        if (userRole === 'ADMIN') {
          fallbackRedirect = '/admin';
        } else if (userRole === 'SELLER') {
          fallbackRedirect = '/dashboard';
        }
      } catch (roleError) {
        console.error('[Login] Error fetching user role:', roleError);
        // Fallback already set to '/'
      }
      
      // Validate the redirect URL against the user's role
      let redirectUrl = searchParams.get('redirect') || fallbackRedirect;
      console.log('[Login] Redirect URL from params:', searchParams.get('redirect'), 'Fallback:', fallbackRedirect, 'Final:', redirectUrl);
      
      const redirectPath = new URL(redirectUrl, 'http://localhost').pathname;
      
      // Check if user has access to the redirect URL
      const isAdminRoute = redirectPath.startsWith('/admin');
      const isSellerRoute = ['/dashboard', '/listings/new'].some(p => redirectPath.startsWith(p)) || /^\/listings\/[^/]+\/edit$/.test(redirectPath);
      
      if (isAdminRoute && userRole !== 'ADMIN') {
        console.log('[Login] User not admin, using fallback');
        redirectUrl = fallbackRedirect;
      } else if (isSellerRoute && userRole !== 'SELLER' && userRole !== 'ADMIN') {
        console.log('[Login] User not seller, using fallback');
        redirectUrl = fallbackRedirect;
      }
      
      console.log('[Login] Final redirect URL:', redirectUrl);
      router.push(redirectUrl);
      console.log('[Login] router.push called');
    } catch (err: any) {
      console.error('[Login] handleLoginSuccess error:', err);
      throw err;
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      console.log('[Login] Form submitted');
      await setPersistence(auth, values.rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      console.log('[Login] User authenticated, calling handleLoginSuccess');
      await handleLoginSuccess(userCredential.user);
    } catch (error: any) {
      console.error('[Login] onSubmit error:', error);
      const message = error.code ? getFirebaseAuthErrorMessage(error.code) : error.message;
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: message,
      });
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleSubmitting(true);
    try {
        const provider = new GoogleAuthProvider();
        await setPersistence(auth, browserLocalPersistence); // Google sign-in always uses local persistence
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
             await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                phone: user.phoneNumber || null,
                role: 'BUYER',
                verified: false,
                createdAt: serverTimestamp(),
            });
        }
        
        await handleLoginSuccess(user);

    } catch (error: any) {
        const message = error.code ? getFirebaseAuthErrorMessage(error.code) : error.message;
        toast({
            variant: 'destructive',
            title: 'Sign In Failed',
            description: message,
        });
        setIsGoogleSubmitting(false);
    }
  }

  return (
    <div className="w-full lg:grid lg:min-h-[calc(100vh-4rem)] lg:grid-cols-2 xl:min-h-[calc(100vh-4rem)]">
      <div className="hidden bg-muted lg:block relative">
         <div className="absolute inset-0 bg-zinc-900/10" />
         <div className="relative z-20 flex items-center text-lg font-medium text-foreground p-10">
            <LandPlot className="mr-2 h-6 w-6" />
            Kenya Land Trust
        </div>
         <div className="relative z-20 h-full flex flex-col justify-center items-center p-10 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-primary">Trust in Every Transaction</h2>
            <p className="mt-4 text-lg text-foreground/80 max-w-md">
                A secure and transparent marketplace for land in Kenya, backed by verification and community trust.
            </p>
        </div>
        <div className="relative z-20 mt-auto p-10">
            <blockquote className="space-y-2 text-foreground/90">
                <p className="text-lg">
                    "Transparency and trust are the cornerstones of every successful land transaction. We are here to build that foundation with you."
                </p>
                <footer className="text-sm">The Kenya Land Trust Team</footer>
            </blockquote>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <div className="grid gap-4">
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                         <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPassword ? "text" : "password"}
                              className="pr-10"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between">
                     <FormField
                        control={form.control}
                        name="rememberMe"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                            Remember me
                            </FormLabel>
                        </FormItem>
                        )}
                    />
                    <Link
                        href="/forgot-password"
                        className="inline-block text-sm underline"
                    >
                        Forgot your password?
                    </Link>
                  </div>

                  <Button variant="accent" type="submit" className="w-full" disabled={isSubmitting || isGoogleSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Login
                  </Button>
                </form>
              </Form>
             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting || isGoogleSubmitting}>
                {isGoogleSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Login with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
