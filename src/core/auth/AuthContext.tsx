import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signInWithOAuth: (provider: 'github' | 'google') => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // 1. Fetch current session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 2. Listen to real-time auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = useCallback((mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase environment variables are missing. Please configure .env file.') };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setIsAuthModalOpen(false);
    }
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase environment variables are missing. Please configure .env file.') };
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { error: new Error(error.message) };
    }
    const needsEmailConfirmation = Boolean(data.user && !data.session);
    if (!needsEmailConfirmation) {
      setIsAuthModalOpen(false);
    }
    return { error: null, needsEmailConfirmation };
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'github' | 'google') => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase environment variables are missing. Please configure .env file.') };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    return { error: error ? new Error(error.message) : null };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured: isSupabaseConfigured,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
