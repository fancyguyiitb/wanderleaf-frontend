'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
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

const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/\d/, 'Include a number');

const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your full name'),
    email: z.string().trim().email('Please enter a valid email'),
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the terms to continue' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: SignupValues) => {
    const email = values.email.trim();
    const fullName = values.name.trim();
    const usernameFromName = fullName || email.split('@')[0];

    // Backend expects: username (full name), email, phone_number, password
    const normalizedPhone = values.phone.replace(/[^\d]/g, '');

    const payload = {
      username: usernameFromName,
      email,
      phone_number: normalizedPhone,
      password: values.password,
    };

    try {
      // Create the user
      const user = await apiFetch<{ id: string; username: string; email: string }>(
        '/api/v1/auth/register/',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      // Automatically log them in to improve UX
      const loginResponse = await apiFetch<{
        access: string;
        refresh?: string;
        user: { id: string; username: string; email: string; phone_number: string | null };
      }>('/api/v1/auth/login/', {
        method: 'POST',
        body: JSON.stringify({
          email: user.email,
          password: values.password,
        }),
      });

      const displayName = loginResponse.user.username || loginResponse.user.email;

      setAuth({
        user: {
          id: String(loginResponse.user.id),
          name: displayName,
          email: loginResponse.user.email,
          isHost: false,
        },
        accessToken: loginResponse.access,
        refreshToken: loginResponse.refresh ?? null,
      });

      router.push('/dashboard');
    } catch (error: any) {
      const message = error?.message ?? 'Unable to create your account. Please try again.';
      form.setError('email', { type: 'manual', message });
    }
  };
  const passwordValue = form.watch('password');
  const requirements = [
    { label: 'At least 8 characters', met: passwordValue.length >= 8 },
    { label: 'Uppercase & lowercase letters', met: /[a-z]/.test(passwordValue) && /[A-Z]/.test(passwordValue) },
    { label: 'At least one number', met: /\d/.test(passwordValue) },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl"
        >
          <div className="grid gap-10 lg:grid-cols-[0.9fr,1.1fr] items-center">
            {/* Left: Auth Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="card-elegant border-none rounded-2xl">
                <CardHeader className="space-y-2 text-center">
                  <CardTitle className="font-playfair text-3xl text-foreground">
                    Create your WanderLeaf account
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Join a community of travelers who prefer cabins, treehouses, and nature-first stays.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <Input
                                  {...field}
                                  placeholder="Jane Doe"
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
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
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
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                  size={18}
                                />
                                <Input
                                  {...field}
                                  type="tel"
                                  placeholder="+1 555 123 4567"
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
                            <FormLabel>Password</FormLabel>
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

                            {passwordValue && (
                              <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 space-y-1.5"
                              >
                                {requirements.map((req) => (
                                  <div key={req.label} className="flex items-center gap-2 text-xs">
                                    <CheckCircle
                                      size={14}
                                      className={req.met ? 'text-green-600' : 'text-muted-foreground'}
                                      fill={req.met ? 'currentColor' : 'none'}
                                    />
                                    <span className={req.met ? 'text-foreground' : 'text-muted-foreground'}>
                                      {req.label}
                                    </span>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <Input
                                  {...field}
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  placeholder="••••••••"
                                  className="pl-10 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="agreeToTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border bg-muted/40 px-3 py-3">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-border cursor-pointer accent-primary"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-tight">
                              <FormLabel className="text-sm font-normal text-foreground">
                                I agree to the{' '}
                                <Link href="#" className="text-primary hover:underline">
                                  Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link href="#" className="text-primary hover:underline">
                                  Privacy Policy
                                </Link>
                                .
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 text-base font-semibold"
                      >
                        {isLoading ? 'Creating your account...' : 'Create account'}
                      </Button>
                    </form>
                  </Form>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right: Brand / Story */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

                <Card className="card-elegant relative border-none bg-gradient-to-br from-card to-secondary/40 p-8">
                  <p className="text-sm font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
                    Stay closer to nature
                  </p>
                  <h2 className="font-playfair text-4xl xl:text-5xl font-bold text-foreground mb-4">
                    Discover cabins, hideaways, and retreats you&apos;ll want to return to.
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base max-w-md mb-4">
                    Build your wishlist, follow trusted hosts, and plan slow getaways that feel like a deep breath.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    We carefully curate each WanderLeaf listing to meet our standards for comfort, authenticity, and
                    connection to the outdoors.
                  </p>
                </Card>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
