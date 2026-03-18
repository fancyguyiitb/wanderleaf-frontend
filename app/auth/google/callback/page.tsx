'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import {
  type BackendAuthResponse,
  getSafeRedirect,
  persistAuthSession,
} from '@/lib/auth-session';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const didRun = useRef(false);
  const redirectTo = useMemo(
    () => getSafeRedirect(searchParams.get('redirect')),
    [searchParams]
  );
  const [message, setMessage] = useState('Finishing your Google sign-in...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const error = searchParams.get('error');
    const code = searchParams.get('code');

    if (error) {
      setIsError(true);
      setMessage(error);
      return;
    }

    if (!code) {
      setIsError(true);
      setMessage('Google sign-in could not be completed. Please try again.');
      return;
    }

    (async () => {
      try {
        const response = await apiFetch<BackendAuthResponse>('/api/v1/auth/google/exchange/', {
          method: 'POST',
          body: JSON.stringify({ code }),
          skipAuthHeader: true,
        });

        persistAuthSession(response, { remember: true });
        router.replace(getSafeRedirect(response.redirect ?? redirectTo));
      } catch (error: unknown) {
        setIsError(true);
        setMessage(
          error instanceof Error
            ? error.message
            : 'Google sign-in could not be completed. Please try again.'
        );
      }
    })();
  }, [redirectTo, router, searchParams]);

  const loginHref = `/auth/login?redirect=${encodeURIComponent(redirectTo)}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg border-none rounded-2xl card-elegant">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="font-playfair text-3xl text-foreground">
              {isError ? 'Google sign-in failed' : 'Signing you in'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {message}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-4">
            {!isError ? (
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <Button asChild className="w-full">
                  <Link href={loginHref}>Back to sign in</Link>
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  If the problem continues, check that Google OAuth is configured in the backend
                  environment.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
