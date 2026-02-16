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
  const { setAuth, logout } = useAuthStore((s) => ({
    setAuth: s.setAuth,
    logout: s.logout,
  }));

  const didRun = useRef(false);

  useEffect(() => {
    // Run exactly once per page load (prevents infinite /me loops)
    if (didRun.current) return;
    didRun.current = true;

    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem("wanderleaf_auth");
    if (!raw) return;

    let parsed: PersistedAuth | null = null;
    try {
      parsed = JSON.parse(raw) as PersistedAuth;
    } catch {
      window.localStorage.removeItem("wanderleaf_auth");
      return;
    }

    const access = parsed?.access ?? "";
    const refresh = parsed?.refresh ?? null;
    const persistedUser = parsed?.user ?? null;
    if (!access || !persistedUser) return;

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
  }, [logout, setAuth]);

  return null;
}

