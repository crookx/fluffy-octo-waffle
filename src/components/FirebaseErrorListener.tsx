'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/lib/error-emitter';
import type { FirestorePermissionError } from '@/lib/errors';

// This component listens for custom Firestore permission errors and throws them.
// Next.js development error overlay will catch this and display it.
// This should ONLY be rendered in a development environment.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Throw the error so the Next.js overlay can catch and display it.
      // This provides a much better debugging experience than just console logging.
      throw error;
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null; // This component does not render anything.
}
