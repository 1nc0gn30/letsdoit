import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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

interface NetlifyUser {
  email: string;
  user_metadata: { display_name?: string };
  jwt: () => Promise<string>;
}

interface AuthContextValue {
  user: NetlifyUser | null;
  profile: Profile | null;
  loading: boolean;
  token: string | null;
  signUp: () => void;
  signIn: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getWidget() {
  return (window as any).netlifyIdentity;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NetlifyUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (t: string) => {
    const res = await fetch('/.netlify/functions/profile', {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data as Profile);
      return data as Profile;
    }
    setProfile(null);
    return null;
  };

  useEffect(() => {
    const widget = getWidget();
    if (!widget) {
      setLoading(false);
      return;
    }

    const handleLogin = (u: NetlifyUser) => {
      setLoading(true);
      setUser(u);
      u.jwt()
        .then(async (t: string) => {
          setToken(t);
          await fetchProfile(t);
        })
        .finally(() => setLoading(false));
    };

    const handleLogout = () => {
      setUser(null);
      setToken(null);
      setProfile(null);
    };

    const handleInit = () => {
      const current = widget.currentUser?.();
      if (current) {
        handleLogin(current);
      } else {
        setLoading(false);
      }
    };

    widget.on('init', handleInit);
    widget.on('login', handleLogin);
    widget.on('logout', handleLogout);
    widget.init();

    return () => {
      widget.off('init', handleInit);
      widget.off('login', handleLogin);
      widget.off('logout', handleLogout);
    };
  }, []);

  const signUp = () => {
    getWidget()?.open('signup');
  };

  const signIn = () => {
    getWidget()?.open('login');
  };

  const signOut = async () => {
    getWidget()?.logout();
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
