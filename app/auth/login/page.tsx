'use client';

import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Mail, Lock, Eye, EyeOff, Phone, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const phoneSchema = z
  .string()
  .trim()
  .min(8, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .regex(/^\+?[0-9()\-\s]+$/, 'Enter a valid phone number');

const loginSchema = z
  .object({
    loginMethod: z.enum(['email']),
    email: z.string().trim().email('Please enter a valid email'),
    phone: phoneSchema.optional().or(z.literal('')),
    password: z.string().min(1, 'Password is required'),
    remember: z.boolean().optional(),
  })
  .refine(
    (data) => !!data.email && data.email.length > 0,
    {
      message: 'Please provide your email or phone based on the selected method',
      path: ['email'],
    }
  );

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginMethod: 'email',
      email: '',
      phone: '',
      password: '',
      remember: true,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: LoginValues) => {
    const payload = {
      identifier: values.email.trim(),
      password: values.password,
    };

    try {
      console.debug('[Login] Submitting login request', { payload });
      const response = await apiFetch<{
        access: string;
        refresh?: string;
        user: { id: string; username: string; email: string; first_name: string; last_name: string };
      }>('/api/v1/auth/login/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const fullName =
        (response.user.first_name || response.user.last_name
          ? `${response.user.first_name ?? ''} ${response.user.last_name ?? ''}`.trim()
          : response.user.username) || response.user.email;

      setAuth({
        user: {
          id: String(response.user.id),
          name: fullName,
          email: response.user.email,
          isHost: false,
        },
        accessToken: response.access,
        refreshToken: response.refresh ?? null,
      });

      if (values.remember) {
        // Store only what we need to restore the session; avoid storing sensitive extras
        window.localStorage.setItem(
          'wanderleaf_auth',
          JSON.stringify({
            access: response.access,
            refresh: response.refresh ?? null,
            user: {
              id: String(response.user.id),
              name: fullName,
              email: response.user.email,
              isHost: false,
            },
          })
        );
      } else {
        window.localStorage.removeItem('wanderleaf_auth');
      }

      router.push('/dashboard');
    } catch (error: any) {
      console.error('[Login] Login failed', { error });
      const message = error?.message ?? 'Unable to sign you in. Please try again.';
      form.setError('password', { type: 'manual', message });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl"
        >
          <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] items-center">
            {/* Left: Brand / Story */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

                <Card className="card-elegant relative border-none bg-gradient-to-br from-card to-secondary/40 p-8">
                  <p className="text-sm font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
                    Welcome back
                  </p>
                  <h1 className="font-playfair text-4xl xl:text-5xl font-bold text-foreground mb-4">
                    Continue your journey into nature-inspired stays.
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base max-w-md">
                    Sign in to pick up where you left off—favorite cabins, saved trips, and curated stays
                    across the world&apos;s most tranquil landscapes.
                  </p>
                </Card>
              </div>
            </motion.div>

            {/* Right: Auth Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="card-elegant border-none rounded-2xl">
                <CardHeader className="space-y-2 text-center">
                  <CardTitle className="font-playfair text-3xl text-foreground">
                    Sign in to StayNature
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Access your bookings, favorites, and personalized recommendations.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      {/* Login method toggle */}
                      <FormField
                        control={form.control}
                        name="loginMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground">
                              Sign in with
                            </FormLabel>
                            <div className="mt-1 inline-flex w-full gap-2 rounded-lg bg-muted/60 p-1">
                              <button
                                type="button"
                                onClick={() => field.onChange('email')}
                                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                  field.value === 'email'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                Email
                              </button>
                              <button
                                type="button"
                                disabled
                                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                  'text-muted-foreground cursor-not-allowed'
                                }`}
                              >
                                Phone (coming soon)
                              </button>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Email address
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                {form.watch('loginMethod') === 'email' ? (
                                  <Mail
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    size={18}
                                  />
                                ) : (
                                  <Phone
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    size={18}
                                  />
                                )}
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="you@example.com"
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>Password</FormLabel>
                              <Link
                                href="/auth/forgot-password"
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                Forgot password?
                              </Link>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <Input
                                  {...field}
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="••••••••"
                                  className="pl-10 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword((prev) => !prev)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="remember"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="w-4 h-4 rounded border-border cursor-pointer accent-primary"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal text-foreground">
                              Remember me on this device
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 text-base font-semibold"
                      >
                        {isLoading ? 'Signing you in...' : 'Sign in'}
                      </Button>
                    </form>
                  </Form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-muted-foreground">
                        Or continue with Google
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="flex w-full items-center justify-center gap-2"
                  >
                    <Chrome size={18} className="text-[#4285F4]" />
                    <span className="text-sm font-medium">Continue with Google</span>
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    New to StayNature?{' '}
                    <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
                      Create an account
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
