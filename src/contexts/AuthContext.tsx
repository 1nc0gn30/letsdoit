import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import netlifyIdentity from 'netlify-identity-widget';
import type { User as NetlifyUser } from 'netlify-identity-widget';

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  preferences: string[];
  credibility_score: number;
  streak: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextValue {
  user: NetlifyUser | null;
  profile: Profile | null;
  loading: boolean;
  token: string | null;
  signUp: (email: string, password: string, meta: { display_name: string }) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NetlifyUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const init = () => {
    const current = netlifyIdentity.currentUser();
    setUser(current);
    if (current) {
      current.jwt().then((t) => setToken(t));
    } else {
      setToken(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    netlifyIdentity.on('init', init);
    netlifyIdentity.on('login', (u) => {
      setUser(u);
      u.jwt().then((t) => setToken(t));
    });
    netlifyIdentity.on('logout', () => {
      setUser(null);
      setToken(null);
      setProfile(null);
    });
    netlifyIdentity.init();
    return () => {
      netlifyIdentity.off('init', init);
    };
  }, []);

  const fetchProfile = async (t: string) => {
    const res = await fetch('/.netlify/functions/profile', {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data as Profile);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    }
  }, [token]);

  const signUp = async (email: string, password: string, meta: { display_name: string }) => {
    try {
      await netlifyIdentity.signup(email, password, { data: { display_name: meta.display_name } });
      return {};
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await netlifyIdentity.login(email, password, true);
      return {};
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  };

  const signOut = async () => {
    netlifyIdentity.logout();
  };

  const refreshProfile = async () => {
    if (token) await fetchProfile(token);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, token, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
