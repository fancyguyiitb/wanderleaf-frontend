"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store";
import { apiFetch } from "@/lib/api";

type PersistedAuth = {
  access?: string;
  refresh?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    isHost: boolean;
  };
};

/**
 * Hydrates auth state on refresh.
 *
 * - Reads `wanderleaf_auth` from localStorage (if present)
 * - Sets Zustand auth state
 * - Fetches `/api/v1/auth/me/` to refresh user (incl avatar) and keep DB as source of truth
 */
export default function AuthHydrator() {
  const { setAuth, setAuthReady, logout } = useAuthStore((s) => ({
    setAuth: s.setAuth,
    setAuthReady: s.setAuthReady,
    logout: s.logout,
  }));

  const didRun = useRef(false);

  useEffect(() => {
    // Run exactly once per page load (prevents infinite /me loops)
    if (didRun.current) return;
    didRun.current = true;

    const markReady = () => setAuthReady(true);

    if (typeof window === "undefined") {
      markReady();
      return;
    }

    const raw = window.localStorage.getItem("wanderleaf_auth");
    if (!raw) {
      markReady();
      return;
    }

    let parsed: PersistedAuth | null = null;
    try {
      parsed = JSON.parse(raw) as PersistedAuth;
    } catch {
      window.localStorage.removeItem("wanderleaf_auth");
      markReady();
      return;
    }

    const access = parsed?.access ?? "";
    const refresh = parsed?.refresh ?? null;
    const persistedUser = parsed?.user ?? null;
    if (!access || !persistedUser) {
      markReady();
      return;
    }

    // 1) Populate Zustand quickly so UI doesn't fall back to "Guest User"
    setAuth({
      user: {
        id: String(persistedUser.id),
        name: persistedUser.name,
        email: persistedUser.email,
        avatar: persistedUser.avatar ?? undefined,
        isHost: !!persistedUser.isHost,
      },
      accessToken: access,
      refreshToken: refresh,
    });
    markReady(); // Allow protected pages to render immediately; /me refresh runs in background

    // 2) Refresh user from backend (authoritative), especially for avatar changes
    (async () => {
      try {
        const me = await apiFetch<{
          id: string;
          username: string;
          email: string;
          phone_number: string | null;
          avatar: string | null;
          date_joined: string;
        }>("/api/v1/auth/me/", {
          method: "GET",
          headers: { Authorization: `Bearer ${access}` },
        });

        const nextUser = {
          id: String(me.id),
          name: me.username,
          email: me.email,
          avatar: me.avatar ?? undefined,
          isHost: !!persistedUser.isHost,
        };

        setAuth({ user: nextUser, accessToken: access, refreshToken: refresh });

        // Keep persisted storage up-to-date (so refresh shows latest avatar)
        window.localStorage.setItem(
          "wanderleaf_auth",
          JSON.stringify({
            access,
            refresh,
            user: nextUser,
          })
        );
      } catch (e: any) {
        const message = e?.message ?? "";
        if (message.includes("Given token not valid") || message.includes("Unauthorized")) {
          logout();
          window.localStorage.removeItem("wanderleaf_auth");
        }
      }
    })();
  }, [logout, setAuth, setAuthReady]);

  return null;
}

