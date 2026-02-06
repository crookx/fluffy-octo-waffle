'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

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
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });
  
  // Common function to handle successful login flow
  const handleLoginSuccess = async (user: User) => {
    console.log('handleLoginSuccess: Starting session creation process for user:', user.uid);
    const idToken = await user.getIdToken();

    // Set session cookie
    console.log('handleLoginSuccess: Sending idToken to /api/auth/session');
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    
    console.log('handleLoginSuccess: Received response from /api/auth/session. Status:', response.status);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Could not parse error response from server.' }));
        console.error('handleLoginSuccess: Session creation failed. Server response:', errorData);
        throw new Error(errorData.message || 'Failed to create session on the server.');
    }

    console.log('handleLoginSuccess: Session created successfully.');
    toast({ title: 'Login Successful', description: "Welcome back!" });
    
    let fallbackRedirect = '/dashboard';
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const role = userDoc.exists() ? userDoc.data()?.role : null;
      fallbackRedirect = role === 'ADMIN' ? '/admin' : '/dashboard';
    } catch (roleError) {
      console.error('handleLoginSuccess: Failed to read user role. Falling back to dashboard.', roleError);
    }
    const redirectUrl = searchParams.get('redirect') || fallbackRedirect;
    console.log('handleLoginSuccess: Redirecting to', redirectUrl);
    window.location.href = redirectUrl;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    console.log('LoginPage onSubmit: Attempting to sign in with email/password.');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      console.log('LoginPage onSubmit: signInWithEmailAndPassword successful for user:', userCredential.user.uid);
      await handleLoginSuccess(userCredential.user);
    } catch (error: any) {
      console.error('LoginPage onSubmit: Caught error during sign-in process.', error);
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
    console.log('LoginPage handleGoogleSignIn: Attempting to sign in with Google.');
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log('LoginPage handleGoogleSignIn: Google sign-in successful for user:', user.uid);

        // Check if user exists in Firestore, if not, create a document
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
             console.log('LoginPage handleGoogleSignIn: New Google user. Creating Firestore document.');
             await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                phone: user.phoneNumber || null,
                role: 'SELLER', // Default role for new sign-ups
                verified: false,
                createdAt: serverTimestamp(),
            });
        } else {
            console.log('LoginPage handleGoogleSignIn: Existing Google user found in Firestore.');
        }
        
        await handleLoginSuccess(user);

    } catch (error: any) {
        console.error('LoginPage handleGoogleSignIn: Caught error during Google sign-in process.', error);
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
    <div className="container mx-auto max-w-sm py-10">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button variant="accent" type="submit" className="w-full" disabled={isSubmitting || isGoogleSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Login with Email
              </Button>
            </form>
          </Form>
          
          <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
          </div>
          
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting || isGoogleSubmitting}>
            {isGoogleSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Google
          </Button>

          <div className="mt-6 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="underline hover:text-primary">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
