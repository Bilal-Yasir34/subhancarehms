import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import type { User, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function avatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

function makeUser(session: Session, profile: { full_name: string; role: string; doctor_id?: string | null; patient_id?: string | null; department?: string | null; phone?: string | null; avatar?: string | null }): User {
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name: profile.full_name,
    role: profile.role as UserRole,
    avatar: profile.avatar ?? avatarUrl(profile.full_name),
    doctorId: profile.doctor_id ?? undefined,
    patientId: profile.patient_id ?? undefined,
    department: profile.department ?? undefined,
    phone: profile.phone ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (session: Session): Promise<User | null> => {
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('full_name, role, doctor_id, patient_id, department, phone, avatar, active')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    if (!data.active) throw new Error('Your account has been deactivated. Contact the administrator.');
    return makeUser(session, data);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const u = await fetchProfile(session);
        if (mounted) setUser(u);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!session) {
          setUser(null);
          setLoading(false);
          return;
        }
        try {
          const u = await fetchProfile(session);
          setUser(u);
        } catch {
          setUser(null);
          await supabase.auth.signOut();
        } finally {
          setLoading(false);
        }
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('Login failed — no session returned');
    const u = await fetchProfile(data.session);
    if (!u) throw new Error('No staff profile found for this account. Contact the administrator.');
    setUser(u);
    return u;
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUser(null);
      return;
    }
    const u = await fetchProfile(session);
    setUser(u);
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
