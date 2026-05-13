import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, ThumbsUp, ThumbsDown, X, Check, Clock, Star, Zap } from 'lucide-react';
import { Place } from '../data/places';

export interface SuggestionCardProps {
  place: Place | null;
  onAccept: () => void;
  onDecline: () => void;
  onCheckIn: () => void;
  onRate: (liked: boolean) => void;
  onDismiss: () => void;
  phase: 'prompt' | 'suggesting' | 'accepted' | 'checked_in' | 'rated';
  distance?: number | null;
}

export default function SuggestionCard({
  place,
  onAccept,
  onDecline,
  onCheckIn,
  onRate,
  onDismiss,
  phase,
  distance,
}: SuggestionCardProps) {
  const [showRate, setShowRate] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {phase === 'prompt' && (
        <motion.div
          key="prompt"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
              <Zap size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ready to explore?</h2>
            <p className="text-slate-400 mb-8">
              Hampton Roads has something waiting for you. Commit to a suggestion and build your credibility score.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onAccept}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Yes, I'm Ready
              </button>
              <button
                onClick={onDecline}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {phase === 'suggesting' && place && (
        <motion.div
          key="suggesting"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Today's Pick</div>

            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-slate-700">
              {place.emoji}
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{place.name}</h3>
            <p className="text-sm text-slate-400 mb-1">{place.description}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
              <MapPin size={12} />
              {place.address}
            </div>

            {distance !== null && distance !== undefined && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                <Navigation size={14} className="text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300">{distance.toFixed(1)} miles away</span>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mb-6">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onAccept}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Navigation size={16} />
                I'm Going
              </button>
              <button
                onClick={onDecline}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
              >
                Pass
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {phase === 'accepted' && place && (
        <motion.div
          key="accepted"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-3">You're Committed</div>

            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-slate-700">
              {place.emoji}
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{place.name}</h3>
            <p className="text-sm text-slate-400 mb-4">
              Head over now. Check in when you arrive to confirm your visit and earn credibility.
            </p>

            {distance !== null && distance !== undefined && (
              <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700">
                <Clock size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-300">{distance.toFixed(1)} miles away</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onCheckIn}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Check size={16} />
                Check In
              </button>
              <button
                onClick={onDecline}
                className="px-5 py-3 bg-red-900/40 hover:bg-red-900/60 text-red-200 font-bold rounded-xl transition-colors border border-red-800"
              >
                Didn't Go
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {phase === 'checked_in' && place && !showRate && (
        <motion.div
          key="checked_in"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-600/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
              <Check size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Checked In!</h3>
            <p className="text-sm text-slate-400 mb-6">
              Great commitment. How was {place.name}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRate(true); onRate(true); }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ThumbsUp size={16} />
                Loved It
              </button>
              <button
                onClick={() => { setShowRate(true); onRate(false); }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ThumbsDown size={16} />
                Not For Me
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {phase === 'rated' && (
        <motion.div
          key="rated"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-yellow-600/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/20">
              <Star size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Score Updated</h3>
            <p className="text-sm text-slate-400 mb-6">
              Your feedback shapes future suggestions. See you next time!
            </p>
            <button
              onClick={onDismiss}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
            >
              Keep Exploring
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
