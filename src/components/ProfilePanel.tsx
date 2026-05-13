import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Star, Zap, TrendingUp, ThumbsUp, ThumbsDown, MapPin, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserVisits, getUserFeedback } from '../lib/visitService';
import { hamptonRoadsPlaces } from '../data/places';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
  const { user, profile, token, signOut } = useAuth();
  const [visits, setVisits] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ place_id: string; liked: boolean }[]>([]);
  const [tab, setTab] = useState<'overview' | 'history'>('overview');

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { visits: v } = await getUserVisits(token);
      setVisits(v);
      const { feedback: f } = await getUserFeedback(token);
      setFeedback(f);
    })();
  }, [token]);

  const likedPlaces = feedback.filter((f) => f.liked).map((f) => hamptonRoadsPlaces.find((p) => p.id === f.place_id)).filter(Boolean);
  const dislikedPlaces = feedback.filter((f) => !f.liked).map((f) => hamptonRoadsPlaces.find((p) => p.id === f.place_id)).filter(Boolean);
  const wentCount = visits.filter((v) => v.status === 'checked_in').length;

  const score = profile?.credibility_score ?? 100;
  const streak = profile?.streak ?? 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1500]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 z-[1501] flex flex-col overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{profile?.display_name || user?.email}</h2>
                  <p className="text-xs text-slate-500">Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-slate-800">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/50 rounded-2xl p-3 text-center border border-slate-700/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap size={14} className="text-yellow-400" />
                    <span className="text-lg font-black text-white">{score}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Credibility</p>
                </div>
                <div className="bg-slate-800/50 rounded-2xl p-3 text-center border border-slate-700/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp size={14} className="text-green-400" />
                    <span className="text-lg font-black text-white">{streak}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Streak</p>
                </div>
                <div className="bg-slate-800/50 rounded-2xl p-3 text-center border border-slate-700/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MapPin size={14} className="text-indigo-400" />
                    <span className="text-lg font-black text-white">{wentCount}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visited</p>
                </div>
              </div>
            </div>

            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setTab('overview')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${tab === 'overview' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setTab('history')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${tab === 'history' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                History
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {tab === 'overview' && (
                <>
                  <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ThumbsUp size={12} /> Liked
                    </h4>
                    {likedPlaces.length === 0 && <p className="text-sm text-slate-500">No likes yet. Get out there!</p>}
                    <div className="flex flex-wrap gap-2">
                      {likedPlaces.slice(0, 8).map((p) => (
                        <span key={p.id} className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/20">
                          {p.emoji} {p.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ThumbsDown size={12} /> Disliked
                    </h4>
                    {dislikedPlaces.length === 0 && <p className="text-sm text-slate-500">No dislikes yet. That's the spirit!</p>}
                    <div className="flex flex-wrap gap-2">
                      {dislikedPlaces.slice(0, 8).map((p) => (
                        <span key={p.id} className="px-2.5 py-1 rounded-lg bg-red-600/10 text-red-300 text-[10px] font-bold border border-red-500/20">
                          {p.emoji} {p.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Settings size={12} /> Preferences
                    </h4>
                    <p className="text-sm text-slate-500 mb-3">{profile?.preferences?.length || 0} interests selected</p>
                  </div>
                </>
              )}

              {tab === 'history' && (
                <>
                  {visits.length === 0 && (
                    <div className="text-center py-10">
                      <Star className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">No visits yet. Your adventure starts here.</p>
                    </div>
                  )}
                  {visits.map((v) => {
                    const place = hamptonRoadsPlaces.find((p) => p.id === v.place_id);
                    if (!place) return null;
                    return (
                      <div key={v.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-lg">{place.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{place.name}</p>
                          <p className="text-[10px] text-slate-500">{new Date(v.created_at).toLocaleDateString()} · {v.status}</p>
                        </div>
                        {v.liked === true && <ThumbsUp size={14} className="text-indigo-400" />}
                        {v.liked === false && <ThumbsDown size={14} className="text-red-400" />}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-800">
              <button
                onClick={async () => { await signOut(); onClose(); }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
