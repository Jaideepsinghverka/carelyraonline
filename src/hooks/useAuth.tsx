import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AuthUser, AppRole, Profile, UserRole, Hospital } from '@/types/database';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata: { name: string; hospital_id: string; role: AppRole }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (authUser: User) => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).single(),
        supabase.from('user_roles').select('*').eq('user_id', authUser.id),
      ]);

      if (profileRes.error || !profileRes.data) {
        console.error('Profile fetch error:', profileRes.error);
        setUser(null);
        return;
      }

      const profile = profileRes.data as Profile;
      const roles = (rolesRes.data as UserRole[] || []).map(r => r.role);

      const hospitalRes = await supabase.from('hospitals').select('*').eq('id', profile.hospital_id).single();

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        profile,
        roles,
        hospital: (hospitalRes.data as Hospital) || null,
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
      setUser(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserData(session.user);
      } else {
        setSupabaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        fetchUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, metadata: { name: string; hospital_id: string; role: AppRole }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  const hasRole = (role: AppRole) => user?.roles.includes(role) ?? false;

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, signIn, signUp, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
