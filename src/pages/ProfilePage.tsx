import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Zap, TrendingUp, MapPin, ThumbsUp, ThumbsDown, Star, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserVisits, getUserFeedback } from '../lib/visitService';
import { availableTags, hamptonRoadsPlaces, Place } from '../data/places';
import SEO from '../components/SEO';

export default function ProfilePage() {
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

  const isPlace = (place: Place | undefined): place is Place => Boolean(place);
  const liked = feedback.filter((f) => f.liked).map((f) => hamptonRoadsPlaces.find((p) => p.id === f.place_id)).filter(isPlace);
  const disliked = feedback.filter((f) => !f.liked).map((f) => hamptonRoadsPlaces.find((p) => p.id === f.place_id)).filter(isPlace);
  const wentCount = visits.filter((v) => v.status === 'checked_in').length;

  return (
    <>
      <SEO title="Profile — Navi Hampton Roads" />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20">
              <User size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{profile?.display_name || user?.email}</h1>
              <p className="text-sm text-slate-500">Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-700/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-2xl font-black text-white">{profile?.credibility_score ?? 100}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Credibility</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-700/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp size={14} className="text-green-400" />
                <span className="text-2xl font-black text-white">{profile?.streak ?? 0}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Streak</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-700/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MapPin size={14} className="text-indigo-400" />
                <span className="text-2xl font-black text-white">{wentCount}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visited</p>
            </div>
          </div>
        </div>

        <div className="flex border-b border-slate-800 mb-6">
          <button onClick={() => setTab('overview')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${tab === 'overview' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>Overview</button>
          <button onClick={() => setTab('history')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${tab === 'history' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>History</button>
        </div>

        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><ThumbsUp size={12} /> Liked</h3>
              {liked.length === 0 && <p className="text-sm text-slate-500">No likes yet. Get out there!</p>}
              <div className="flex flex-wrap gap-2">
                {liked.slice(0, 12).map((p) => (
                  <span key={p.id} className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/20">{p.emoji} {p.name}</span>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><ThumbsDown size={12} /> Disliked</h3>
              {disliked.length === 0 && <p className="text-sm text-slate-500">No dislikes yet.</p>}
              <div className="flex flex-wrap gap-2">
                {disliked.slice(0, 12).map((p) => (
                  <span key={p.id} className="px-2.5 py-1 rounded-lg bg-red-600/10 text-red-300 text-[10px] font-bold border border-red-500/20">{p.emoji} {p.name}</span>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Settings size={12} /> Preferences</h3>
              <p className="text-sm text-slate-500">{profile?.preferences?.length || 0} interests selected</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {(profile?.preferences || []).map((pref) => {
                  const tag = availableTags.find((t) => t.id === pref);
                  return tag ? (
                    <span key={pref} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">{tag.icon} {tag.label}</span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-3">
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
                <div key={v.id} className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-lg">{place.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{place.name}</p>
                    <p className="text-[10px] text-slate-500">{new Date(v.created_at).toLocaleDateString()} · {v.status}</p>
                  </div>
                  {v.liked === true && <ThumbsUp size={14} className="text-indigo-400" />}
                  {v.liked === false && <ThumbsDown size={14} className="text-red-400" />}
                </div>
              );
            })}
          </div>
        )}

        <button onClick={async () => await signOut()} className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  );
}
