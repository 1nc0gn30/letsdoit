import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Navigation, ThumbsUp, ThumbsDown, Check, Star, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hamptonRoadsPlaces, Tag } from '../data/places';
import { pickSuggestion, computeCredibilityDelta } from '../lib/suggestionEngine';
import { createUserVisit, updateUserVisit, getUserVisits, submitUserFeedback } from '../lib/visitService';
import { adjustCredibility, adjustStreak } from '../lib/profileService';
import SEO from '../components/SEO';

export default function DailyPicks() {
  const { user, profile, token, refreshProfile } = useAuth();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [phase, setPhase] = useState<'prompt' | 'suggesting' | 'accepted' | 'checked_in' | 'rated'>('prompt');
  const [suggestedPlace, setSuggestedPlace] = useState<typeof hamptonRoadsPlaces[0] | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ place_id: string; status: string }[]>([]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    getUserVisits(token).then(({ visits }) => {
      setHistory(visits.map((v) => ({ place_id: v.place_id, status: v.status })));
    });
  }, [token]);

  const distanceTo = useCallback(() => {
    if (!userLocation || !suggestedPlace) return null;
    const R = 3958.8;
    const dLat = ((suggestedPlace.lat - userLocation[0]) * Math.PI) / 180;
    const dLon = ((suggestedPlace.lng - userLocation[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation[0] * Math.PI) / 180) *
        Math.cos((suggestedPlace.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, [userLocation, suggestedPlace]);

  const generate = useCallback(() => {
    const visited = history.filter((h) => h.status === 'checked_in').map((h) => h.place_id);
    const skipped = history.filter((h) => h.status === 'skipped' || h.status === 'declined').map((h) => h.place_id);
    const prefs = (profile?.preferences as Tag[] | undefined) || [];
    const place = pickSuggestion(hamptonRoadsPlaces, prefs, userLocation, [], skipped, visited);
    setSuggestedPlace(place);
    setPhase('suggesting');
    if (place && token) {
      createUserVisit(token, place.id, 'suggested').then(({ visit }) => {
        if (visit) setVisitId(visit.id);
      });
    }
  }, [history, profile, userLocation, token]);

  const handleAccept = async () => {
    if (!suggestedPlace || !token || !visitId) return;
    await updateUserVisit(token, visitId, { status: 'accepted' });
    setPhase('accepted');
  };

  const handleDecline = async () => {
    if (!token || !suggestedPlace) { setPhase('prompt'); return; }
    if (visitId) await updateUserVisit(token, visitId, { status: 'declined' });
    await adjustCredibility(token, computeCredibilityDelta('declined'));
    await refreshProfile();
    setPhase('prompt');
  };

  const handleSkip = async () => {
    if (!token || !suggestedPlace || !visitId) { setPhase('prompt'); return; }
    await updateUserVisit(token, visitId, { status: 'skipped' });
    await adjustCredibility(token, computeCredibilityDelta('skipped'));
    await adjustStreak(token, true);
    await refreshProfile();
    setPhase('prompt');
  };

  const handleCheckIn = async () => {
    if (!token || !suggestedPlace || !visitId) return;
    await updateUserVisit(token, visitId, { status: 'checked_in' });
    setPhase('checked_in');
  };

  const handleRate = async (liked: boolean) => {
    if (!token || !suggestedPlace || !visitId) return;
    await updateUserVisit(token, visitId, { liked, disliked: !liked });
    await submitUserFeedback(token, suggestedPlace.id, liked);
    await adjustCredibility(token, computeCredibilityDelta('went', liked));
    if (liked) await adjustStreak(token, false);
    await refreshProfile();
    setPhase('rated');
  };

  const dist = distanceTo();

  return (
    <>
      <SEO title="Daily Picks — Navi Hampton Roads" />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Daily Pick</h1>
          <p className="text-slate-400">One suggestion, one commitment. Build your credibility.</p>
        </div>

        {phase === 'prompt' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 bg-indigo-600/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Ready to explore?</h2>
            <p className="text-slate-400 mb-6">We'll find the perfect spot for you right now.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={generate} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">Yes, I'm Ready</button>
            </div>
          </motion.div>
        )}

        {phase === 'suggesting' && suggestedPlace && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Today's Pick</div>
            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4">{suggestedPlace.emoji}</div>
            <h3 className="text-xl font-bold text-white mb-1">{suggestedPlace.name}</h3>
            <p className="text-sm text-slate-400 mb-1">{suggestedPlace.description}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4"><Navigation size={12} />{suggestedPlace.address}</div>
            {dist !== null && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                <Navigation size={14} className="text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300">{dist.toFixed(1)} miles away</span>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {suggestedPlace.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">{tag}</span>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleAccept} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"><Navigation size={16} />I'm Going</button>
              <button onClick={handleDecline} className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors">Pass</button>
            </div>
          </motion.div>
        )}

        {phase === 'accepted' && suggestedPlace && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-3">You're Committed</div>
            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4">{suggestedPlace.emoji}</div>
            <h3 className="text-xl font-bold text-white mb-1">{suggestedPlace.name}</h3>
            <p className="text-sm text-slate-400 mb-4">Head over now. Check in when you arrive.</p>
            <div className="flex gap-3">
              <button onClick={handleCheckIn} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"><Check size={16} />Check In</button>
              <button onClick={handleSkip} className="px-5 py-3 bg-red-900/40 hover:bg-red-900/60 text-red-200 font-bold rounded-xl transition-colors border border-red-800">Didn't Go</button>
            </div>
          </motion.div>
        )}

        {phase === 'checked_in' && suggestedPlace && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-green-600/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Checked In!</h3>
            <p className="text-sm text-slate-400 mb-6">How was {suggestedPlace.name}?</p>
            <div className="flex gap-3">
              <button onClick={() => handleRate(true)} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"><ThumbsUp size={16} />Loved It</button>
              <button onClick={() => handleRate(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"><ThumbsDown size={16} />Not For Me</button>
            </div>
          </motion.div>
        )}

        {phase === 'rated' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-yellow-600/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Score Updated</h3>
            <p className="text-sm text-slate-400 mb-6">Your feedback shapes future suggestions.</p>
            <button onClick={() => setPhase('prompt')} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">Get Another Pick</button>
          </motion.div>
        )}
      </div>
    </>
  );
}
