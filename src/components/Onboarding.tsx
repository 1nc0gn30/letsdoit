import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Compass, Sparkles } from 'lucide-react';
import { availableTags, Tag } from '../data/places';
import { useAuth } from '../contexts/AuthContext';
import { updatePreferences } from '../lib/profileService';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { user, profile, token, refreshProfile } = useAuth();
  const [step, setStep] = useState<'auth' | 'preferences'>('auth');
  const [preferences, setPreferences] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      if (profile?.preferences && profile.preferences.length > 0) {
        onComplete();
      } else {
        setStep('preferences');
      }
    }
  }, [user, profile, onComplete]);

  const openSignup = () => {
    (window as any).netlifyIdentity?.open('signup');
  };

  const openLogin = () => {
    (window as any).netlifyIdentity?.open('login');
  };

  const toggleTag = (tag: Tag) => {
    setPreferences((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFinish = async () => {
    if (preferences.length === 0) {
      setError('Select at least one interest.');
      return;
    }
    setLoading(true);
    setError('');

    if (token) {
      const { error: saveError } = await updatePreferences(token, preferences);
      if (saveError) {
        setError('Failed to save preferences. Please try again.');
        setLoading(false);
        return;
      }
      await refreshProfile();
    }

    setLoading(false);
    onComplete();
  };

  if (step === 'auth') {
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
              onClick={openSignup}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
            >
              Create Account
            </button>
            <button
              onClick={openLogin}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
            >
              Sign In
            </button>
          </div>
          <p className="mt-6 text-xs text-slate-600">Secure login powered by Netlify Identity</p>
        </motion.div>
      </div>
    );
  }

  // Preferences step
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8"
      >
        <div className="w-14 h-14 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
          <Sparkles size={28} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">What are you into? 🎯</h2>
        <p className="text-slate-400 mb-6">Select a few interests so we can personalize your suggestions.</p>
        <div className="flex flex-wrap gap-3 mb-8">
          {availableTags.map((tag) => {
            const isSelected = preferences.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
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
        <button
          onClick={handleFinish}
          disabled={loading || preferences.length === 0}
          className="w-full py-3.5 bg-indigo-600 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
        >
          {loading ? 'Saving...' : 'Start Exploring'}
        </button>
      </motion.div>
    </div>
  );
}
