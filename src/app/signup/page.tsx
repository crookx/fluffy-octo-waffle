'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
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
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  // Common function to handle successful login/signup flow
  const handleAuthSuccess = async (user: User) => {
    console.log('handleAuthSuccess: Starting session creation for new user:', user.uid);
    const idToken = await user.getIdToken();
    
    console.log('handleAuthSuccess: Sending idToken to /api/auth/session');
    const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });

    console.log('handleAuthSuccess: Received response from /api/auth/session. Status:', response.status);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Could not parse error response from server.' }));
        console.error('handleAuthSuccess: Session creation failed. Server response:', errorData);
        throw new Error(errorData.message || 'Failed to create session on the server.');
    }

    console.log('handleAuthSuccess: Session created successfully.');
    toast({ title: 'Account Created', description: "Welcome to Kenya Land Trust!" });
    
    let redirectUrl = '/dashboard';
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const role = userDoc.exists() ? userDoc.data()?.role : null;
      redirectUrl = role === 'ADMIN' ? '/admin' : '/dashboard';
    } catch (roleError) {
      console.error('handleAuthSuccess: Failed to read user role. Falling back to dashboard.', roleError);
    }
    console.log('handleAuthSuccess: Redirecting to', redirectUrl);
    window.location.href = redirectUrl;
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    console.log('SignupPage onSubmit: Attempting to create user with email/password.');
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      console.log('SignupPage onSubmit: User created in Firebase Auth. UID:', user.uid);

      // 2. Update Firebase Auth profile
      await updateProfile(user, { displayName: values.displayName });
      console.log('SignupPage onSubmit: Updated Firebase Auth profile display name.');

      // 3. Create user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: values.displayName,
        photoURL: user.photoURL,
        phone: values.phone || null,
        role: 'SELLER', // Default role
        verified: false, // For future verification processes
        createdAt: serverTimestamp(),
      });
      console.log('SignupPage onSubmit: Created user document in Firestore.');
      
      // 4. Set session cookie and redirect
      await handleAuthSuccess(user);

    } catch (error: any) {
      console.error('SignupPage onSubmit: Caught error during sign-up process.', error);
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
    console.log('SignupPage handleGoogleSignIn: Attempting to sign in with Google.');
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log('SignupPage handleGoogleSignIn: Google sign-in successful. UID:', user.uid);

        // Check if user exists in Firestore, if not, create a document
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
             console.log('SignupPage handleGoogleSignIn: New Google user. Creating Firestore document.');
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
            console.log('SignupPage handleGoogleSignIn: Existing Google user found in Firestore.');
        }
        
        await handleAuthSuccess(user);

    } catch (error: any) {
        console.error('SignupPage handleGoogleSignIn: Caught error during Google sign-in.', error);
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
    <div className="container mx-auto max-w-sm py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>Join our platform to start listing your property.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button variant="accent" type="submit" className="w-full" disabled={isSubmitting || isGoogleSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account with Email
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
            Already have an account?{' '}
            <Link href="/login" className="underline hover:text-primary">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
