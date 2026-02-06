'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { FirebaseErrorListener } from './FirebaseErrorListener';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }, (error) => {
        // This specific listener is critical. A permissions error here means the user
        // cannot even read their own profile, which is a fundamental problem.
        // We log it verbosely but avoid throwing a contextual error that might
        // put the entire UI into an unrecoverable error state.
        console.error(`Critical Error: Could not read user profile for ${user.uid}. Check Firestore security rules for the /users/{userId} path.`, error);
        setUserProfile(null);
        setLoading(false);
      });
      return () => unsubscribeSnapshot();
    }
  }, [user]);

  // Don't show global loading screen on public or auth pages to prevent flashing
  const isPublicPage = pathname === '/' || pathname.startsWith('/listings/') || pathname === '/login' || pathname === '/signup';
  if (loading && !isPublicPage) {
     return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
     );
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {process.env.NODE_ENV === 'development' && <FirebaseErrorListener />}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
