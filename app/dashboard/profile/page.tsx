'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { motion } from 'framer-motion';
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
import { Mail, User, ImageIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { apiFetch, getApiBaseUrl } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatar';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name'),
  email: z.string().trim().email('Please enter a valid email'),
  avatar: z.string().optional().or(z.literal('')),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, accessToken, refreshToken, setAuth, logout } = useAuthStore((state) => ({
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    setAuth: state.setAuth,
    logout: state.logout,
  }));

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  const [initialProfile, setInitialProfile] = useState<{
    name: string;
    email: string;
    avatar: string | null;
  } | null>(user
    ? {
        name: user.name,
        email: user.email,
        avatar: user.avatar ?? null,
      }
    : null);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      avatar: user?.avatar ?? '',
    },
  });

  const isLoading = form.formState.isSubmitting;

  const getEffectiveAccessToken = () => {
    if (accessToken) return accessToken;
    if (typeof window === 'undefined') return '';
    try {
      const raw = window.localStorage.getItem('wanderleaf_auth');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return parsed.access ?? '';
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // Sync initial state when user becomes available
    if (!initialProfile) {
      const avatar = user.avatar ?? null;
      setInitialProfile({
        name: user.name,
        email: user.email,
        avatar,
      });
      setAvatarPreview(avatar);
      setAvatarFile(null);
      setAvatarRemoved(false);
      form.reset({
        name: user.name,
        email: user.email,
        avatar: avatar ?? '',
      });
    }
  }, [user, router, initialProfile, form]);

  const isDirty = (() => {
    if (!initialProfile) return false;
    const values = form.getValues();
    const nameChanged = values.name.trim() !== initialProfile.name;
    const emailChanged = values.email.trim().toLowerCase() !== initialProfile.email.toLowerCase();
    const avatarChanged =
      avatarRemoved ||
      (avatarFile !== null) ||
      (initialProfile.avatar ?? null) !== (avatarPreview ?? null);
    return nameChanged || emailChanged || avatarChanged;
  })();

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const onSubmit = async (values: ProfileValues) => {
    if (!user) return;

    try {
      const token = getEffectiveAccessToken();
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const payload: { username: string; email: string } = {
        username: values.name.trim(),
        email: values.email.trim(),
      };

      const updatedProfile = await apiFetch<{
        id: string;
        username: string;
        email: string;
        phone_number: string | null;
        avatar: string | null;
        date_joined: string;
      }>('/api/v1/auth/me/', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let nextUser = {
        id: String(updatedProfile.id),
        name: updatedProfile.username,
        email: updatedProfile.email,
        avatar: updatedProfile.avatar ?? user.avatar,
        isHost: user.isHost,
      };

      // Handle avatar changes in a second step:
      // - New file selected -> POST /me/avatar/
      // - Avatar removed   -> DELETE /me/avatar/
      if (avatarFile && !avatarRemoved) {
        const baseUrl = getApiBaseUrl();
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const response = await fetch(`${baseUrl}/api/v1/auth/me/avatar/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload profile photo.');
        }

        const data: {
          id: string;
          username: string;
          email: string;
          phone_number: string | null;
          avatar: string | null;
          date_joined: string;
        } = await response.json();

        nextUser = {
          id: String(data.id),
          name: data.username,
          email: data.email,
          avatar: data.avatar ?? nextUser.avatar,
          isHost: nextUser.isHost,
        };
      } else if (avatarRemoved && !avatarFile && (initialProfile?.avatar ?? null)) {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/v1/auth/me/avatar/`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to remove profile photo.');
        }

        const data: {
          id: string;
          username: string;
          email: string;
          phone_number: string | null;
          avatar: string | null;
          date_joined: string;
        } = await response.json();

        nextUser = {
          id: String(data.id),
          name: data.username,
          email: data.email,
          avatar: data.avatar ?? null,
          isHost: nextUser.isHost,
        };
      }

      setAuth({
        user: nextUser,
        accessToken: token,
        refreshToken: refreshToken ?? null,
      });

      // Reset initial profile and local avatar state after successful save
      setInitialProfile({
        name: nextUser.name,
        email: nextUser.email,
        avatar: nextUser.avatar ?? null,
      });
      setAvatarPreview(nextUser.avatar ?? null);
      setAvatarFile(null);
      setAvatarRemoved(false);
      form.reset({
        name: nextUser.name,
        email: nextUser.email,
        avatar: nextUser.avatar ?? '',
      });

      router.push('/dashboard');
    } catch (error: any) {
      const message = error?.message ?? 'Unable to update your profile. Please try again.';

      if (message.includes('Given token not valid') || message.includes('Unauthorized')) {
        // Token is invalid/expired – clear auth and force re-login
        logout();
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('wanderleaf_auth');
        }
        router.replace('/auth/login');
        return;
      }

      form.setError('email', { type: 'manual', message });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl"
        >
          {/* Profile header area */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-elegant mb-10 overflow-hidden rounded-2xl"
          >
            <div className="relative h-40 bg-gradient-to-r from-primary/80 via-accent/70 to-secondary/80">
              <div className="absolute inset-0 opacity-50 mix-blend-soft-light bg-[radial-gradient(circle_at_top,_#ffffff44,_transparent_60%)]" />
            </div>
            <div className="-mt-16 px-6 pb-6 flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-muted overflow-hidden shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getAvatarUrl(avatarPreview ?? user?.avatar, user?.name ?? null)}
                    alt={user?.name ?? 'Profile photo'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 pb-2 sm:pb-4">
                <h1 className="font-playfair text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  {user?.name ?? 'Your name'}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base mt-1">
                  {user?.email ?? 'Add an email so guests and hosts know how to reach you.'}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr] items-start">
            {/* Profile form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="card-elegant border-none rounded-2xl">
                <CardHeader className="space-y-2">
                  <CardTitle className="font-playfair text-3xl text-foreground">
                    Edit profile
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Update the details that appear on your StayNature account.
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
                        name="avatar"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile photo</FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <label className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium cursor-pointer hover:bg-muted transition-colors">
                                    <ImageIcon size={16} />
                                    <span>
                                      {avatarPreview
                                        ? 'Change profile photo'
                                        : 'Upload profile photo'}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (event) => {
                                        const file = event.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          const result = reader.result;
                                          if (typeof result === 'string') {
                                            setAvatarPreview(result);
                                            setAvatarFile(file);
                                            setAvatarRemoved(false);
                                            field.onChange(''); // keep field value simple
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }}
                                    />
                                  </label>
                                  {avatarPreview && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAvatarPreview(null);
                                        setAvatarFile(null);
                                        setAvatarRemoved(true);
                                        field.onChange('');
                                      }}
                                      className="text-xs text-muted-foreground hover:text-foreground underline"
                                    >
                                      Remove current photo
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {avatarPreview
                                    ? 'You already have a profile photo. Upload a new one above if you want to change it.'
                                    : 'Add a clear, front-facing photo so guests and hosts can recognize you.'}
                                </p>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (isDirty) {
                              setShowLeaveConfirm(true);
                            } else {
                              router.push('/dashboard');
                            }
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="px-6"
                        >
                          {isLoading ? 'Saving changes...' : 'Save changes'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right: Copy / guidance */}
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
                    Your StayNature identity
                  </p>
                  <h2 className="font-playfair text-4xl font-bold text-foreground mb-4">
                    Make your profile feel like you.
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base max-w-md mb-4">
                    Guests and hosts will see your name and photo when you book, host, or leave reviews. Choose
                    details that you&apos;re comfortable sharing and that reflect how you want to show up in the StayNature community.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can update these details at any time. For security changes like password or login methods, use the account settings in the auth pages.
                  </p>
                </Card>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card-elegant bg-background rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Discard changes?</h2>
            <p className="text-sm text-muted-foreground">
              You have unsaved changes to your profile. Do you want to save them before leaving this
              page?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLeaveConfirm(false);
                }}
              >
                Continue editing
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  // Discard local changes and navigate away
                  if (initialProfile) {
                    setAvatarPreview(initialProfile.avatar);
                    setAvatarFile(null);
                    setAvatarRemoved(false);
                    form.reset({
                      name: initialProfile.name,
                      email: initialProfile.email,
                      avatar: initialProfile.avatar ?? '',
                    });
                  }
                  setShowLeaveConfirm(false);
                  router.push('/dashboard');
                }}
              >
                Discard changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

