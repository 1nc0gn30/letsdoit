import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Mail, Lock, User, Compass, Eye, EyeOff } from 'lucide-react';
import { availableTags, Tag } from '../data/places';
import { useAuth } from '../contexts/AuthContext';
import { updatePreferences } from '../lib/profileService';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { user, signUp, signIn } = useAuth();
  const [mode, setMode] = useState<'start' | 'signup' | 'login' | 'preferences'>(user ? 'preferences' : 'start');
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferences, setPreferences] = useState<Tag[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) setMode('preferences');
  }, [user]);

  const toggleTag = (tag: Tag) => {
    setPreferences((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSignUp = async () => {
    setError('');
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Please fill all fields. Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error: err } = await signUp(email.trim(), password, { display_name: name.trim() });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setMode('preferences');
  };

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || password.length < 6) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    onComplete();
  };

  const handleFinish = async () => {
    if (preferences.length === 0) {
      setError('Select at least one interest.');
      return;
    }
    setLoading(true);
    // Wait briefly for identity to settle after signup
    await new Promise((r) => setTimeout(r, 600));
    const widget = (window as any).netlifyIdentity;
    const u = widget?.currentUser?.();
    if (u) {
      const t = await u.jwt();
      await updatePreferences(t, preferences);
    }
    setLoading(false);
    onComplete();
  };

  if (mode === 'start') {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8 text-center"
        >
          <div className="w-20 h-20 bg-indigo-600/20 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <Compass size={40} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Navi</h1>
          <p className="text-slate-400 mb-8">Your personal guide to Hampton Roads. Discover places, build credibility, and explore with intention.</p>
          <div className="space-y-3">
            <button
              onClick={() => setMode('signup')}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
            >
              Create Account
            </button>
            <button
              onClick={() => setMode('login')}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (mode === 'login') {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8"
        >
          <button onClick={() => setMode('start')} className="text-slate-500 text-sm mb-4 hover:text-slate-300">← Back</button>
          <div className="w-14 h-14 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
            <MapPin size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 mb-6">Sign in to continue your journey.</p>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-600" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-600" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
          >{loading ? 'Signing in...' : 'Sign In'}</button>
        </motion.div>
      </div>
    );
  }

  if (mode === 'signup' && step === 1) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8"
        >
          <button onClick={() => setMode('start')} className="text-slate-500 text-sm mb-4 hover:text-slate-300">← Back</button>
          <div className="w-14 h-14 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
            <User size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
          <p className="text-slate-400 mb-6">Join Navi and start exploring Hampton Roads.</p>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Display Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                  className="w-full pl-9 pr-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-600" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-600" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-600" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button onClick={handleSignUp} disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
          >{loading ? 'Creating account...' : 'Continue'}</button>
        </motion.div>
      </div>
    );
  }

  // preferences mode
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-1">What are you into? 🎯</h2>
        <p className="text-slate-400 mb-6">Select a few interests so we can personalize your suggestions.</p>
        <div className="flex flex-wrap gap-3 mb-8">
          {availableTags.map((tag) => {
            const isSelected = preferences.includes(tag.id);
            return (
              <button key={tag.id} onClick={() => toggleTag(tag.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
                }`}
              >
                <span>{tag.icon}</span>
                <span className="font-medium text-sm">{tag.label}</span>
              </button>
            );
          })}
        </div>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <div className="flex gap-3">
          {!user && (
            <button onClick={() => setMode('signup')}
              className="px-6 py-3.5 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors"
            >Back</button>
          )}
          <button onClick={handleFinish} disabled={loading || preferences.length === 0}
            className="flex-1 py-3.5 bg-indigo-600 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
          >{loading ? 'Saving...' : 'Start Exploring'}</button>
        </div>
      </motion.div>
    </div>
  );
}
