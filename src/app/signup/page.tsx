'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, LandPlot } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  phone: z.string().optional(),
});

function getFirebaseAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'An account with this email address already exists. Please log in instead.';
        case 'auth/invalid-email':
            return 'The email address you entered is not valid.';
        case 'auth/weak-password':
            return 'The password is too weak. Please choose a stronger password.';
        case 'auth/popup-closed-by-user':
            return 'The sign-up popup was closed before completing. Please try again.';
        default:
            return `An unexpected server error occurred. Please try again. (Code: ${errorCode})`;
    }
}


export default function SignupPage() {
  const router = useRouter();
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
        console.warn('[Signup] Unable to check existing session:', error);
      }
    };
    checkExistingSession();
    return () => {
      isActive = false;
    };
  }, [router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const handleAuthSuccess = async (user: User) => {
    const idToken = await user.getIdToken();
    
    const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Could not parse error response from server.' }));
        throw new Error(errorData.message || 'Failed to create session on the server.');
    }

    toast({ title: 'Account Created', description: "Welcome to Kenya Land Trust!" });
    
    // On signup, we always go to the onboarding page.
    window.location.assign('/onboarding');
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: values.displayName });

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: values.displayName,
        photoURL: user.photoURL,
        phone: values.phone || null,
        role: 'BUYER',
        verified: false,
        createdAt: serverTimestamp(),
      });
      
      await handleAuthSuccess(user);

    } catch (error: any) {
      const message = error.code ? getFirebaseAuthErrorMessage(error.code) : error.message;
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: message,
      });
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleSubmitting(true);
    try {
        const provider = new GoogleAuthProvider();
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
        
        await handleAuthSuccess(user);

    } catch (error: any) {
        const message = error.code ? getFirebaseAuthErrorMessage(error.code) : error.message;
        toast({
            variant: 'destructive',
            title: 'Sign Up Failed',
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
            <h1 className="text-3xl font-bold">Create an account</h1>
            <p className="text-balance text-muted-foreground">
              Enter your information to get started.
            </p>
          </div>
          <div className="grid gap-4">
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl><Input placeholder="+254 712 345678" {...field} /></FormControl>
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
                  <Button variant="accent" type="submit" className="w-full" disabled={isSubmitting || isGoogleSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </Form>
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting || isGoogleSubmitting}>
                {isGoogleSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Sign up with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
