import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { getAuthEmailRedirectTo } from '../utils/authRedirect';

export type AuthContextValue = {
  /** False when the app was built without Supabase keys — sign-in is hidden. */
  available: boolean;
  session: Session | null;
  user: User | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ ok: boolean; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<boolean>;
  /** Permanently deletes the signed-in account (required by App Store rules). */
  deleteAccount: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const NOT_CONFIGURED = 'Sign-in is not available in this build.';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data: { session: next } }) => {
        if (!cancelled) setSession(next);
      })
      .catch(() => {
        // Offline or the project is unreachable: stay a guest.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    if (!supabase) {
      setAuthError(NOT_CONFIGURED);
      return false;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
        return false;
      }
      return true;
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : String(e));
      return false;
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      setAuthError(null);
      if (!supabase) {
        setAuthError(NOT_CONFIGURED);
        return { ok: false, needsEmailConfirmation: false };
      }
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: getAuthEmailRedirectTo(),
          },
        });
        if (error) {
          setAuthError(error.message);
          return { ok: false, needsEmailConfirmation: false };
        }
        return { ok: true, needsEmailConfirmation: !data.session };
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : String(e));
        return { ok: false, needsEmailConfirmation: false };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    setAuthError(null);
    if (!supabase) return true;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
      return false;
    }
    return true;
  }, []);

  const deleteAccount = useCallback(async () => {
    setAuthError(null);
    if (!supabase) return false;
    const { error } = await supabase.rpc('delete_own_account');
    if (error) {
      setAuthError(error.message);
      return false;
    }
    await supabase.auth.signOut();
    setSession(null);
    return true;
  }, []);

  const value = useMemo(
    () => ({
      available: isSupabaseConfigured,
      session,
      user: session?.user ?? null,
      loading,
      authError,
      clearAuthError,
      signIn,
      signUp,
      signOut,
      deleteAccount,
    }),
    [session, loading, authError, clearAuthError, signIn, signUp, signOut, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
