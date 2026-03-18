import { useAuthStore, type User } from '@/lib/store';

export type BackendAuthUser = {
  id: string;
  username?: string | null;
  email: string;
  avatar?: string | null;
};

export type BackendAuthResponse = {
  access: string;
  refresh?: string | null;
  user: BackendAuthUser;
  redirect?: string;
};

export function getSafeRedirect(redirect: string | null): string {
  if (!redirect || typeof redirect !== 'string') return '/dashboard';
  const decoded = decodeURIComponent(redirect);
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.startsWith('/auth')) {
    return '/dashboard';
  }
  return decoded;
}

export function mapBackendAuthUser(user: BackendAuthUser): User {
  const displayName = user.username?.trim() || user.email;
  return {
    id: String(user.id),
    name: displayName,
    email: user.email,
    avatar: user.avatar ?? undefined,
    isHost: false,
  };
}

export function persistAuthSession(
  response: BackendAuthResponse,
  options?: { remember?: boolean }
) {
  const remember = options?.remember ?? true;
  const appUser = mapBackendAuthUser(response.user);

  useAuthStore.getState().setAuth({
    user: appUser,
    accessToken: response.access,
    refreshToken: response.refresh ?? null,
  });

  if (typeof window !== 'undefined') {
    if (remember) {
      window.localStorage.setItem(
        'wanderleaf_auth',
        JSON.stringify({
          access: response.access,
          refresh: response.refresh ?? null,
          user: appUser,
        })
      );
    } else {
      window.localStorage.removeItem('wanderleaf_auth');
    }
  }

  return appUser;
}
