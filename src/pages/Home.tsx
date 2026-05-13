import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Compass, Map, Calendar, Sparkles, TrendingUp, Zap, Star, ChevronRight, Navigation } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hamptonRoadsPlaces, availableTags, Tag } from '../data/places';
import { pickSuggestion } from '../lib/suggestionEngine';
import { getUserVisits } from '../lib/visitService';
import SEO from '../components/SEO';

export default function Home() {
  const { profile, token } = useAuth();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [suggestedPlace, setSuggestedPlace] = useState<typeof hamptonRoadsPlaces[0] | null>(null);
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

  useEffect(() => {
    const visitedIds = history.filter((h) => h.status === 'checked_in').map((h) => h.place_id);
    const skippedIds = history.filter((h) => h.status === 'skipped' || h.status === 'declined').map((h) => h.place_id);
    const prefs = (profile?.preferences as Tag[] | undefined) || [];
    const place = pickSuggestion(hamptonRoadsPlaces, prefs, userLocation, [], skippedIds, visitedIds);
    setSuggestedPlace(place);
  }, [history, profile, userLocation]);

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

  const stats = [
    { label: 'Credibility', value: profile?.credibility_score ?? 100, icon: Zap, color: 'text-yellow-400' },
    { label: 'Streak', value: profile?.streak ?? 0, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Places', value: history.filter((h) => h.status === 'checked_in').length, icon: Star, color: 'text-indigo-400' },
  ];

  return (
    <>
      <SEO title="Navi — Hampton Roads Explorer" />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="text-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
              <Compass size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Explore Hampton Roads
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">
              612 curated places and events. Personalized suggestions. Build your credibility by exploring.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/explore')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <Map size={18} />
                Open Map
              </button>
              <button
                onClick={() => navigate('/daily-picks')}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <Sparkles size={18} />
                Daily Pick
              </button>
            </div>
          </motion.div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                <stat.icon size={20} className={stat.color} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </section>

        {suggestedPlace && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" />
                Today's Pick
              </h2>
              <button
                onClick={() => navigate('/daily-picks')}
                className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                View All <ChevronRight size={14} />
              </button>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer hover:border-indigo-500/30 transition-colors"
              onClick={() => navigate('/explore', { state: { placeId: suggestedPlace.id } })}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-2xl">
                  {suggestedPlace.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">{suggestedPlace.name}</h3>
                  <p className="text-sm text-slate-400 mb-2">{suggestedPlace.description}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Navigation size={12} />
                      {suggestedPlace.address}
                    </span>
                    {distanceTo() !== null && (
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-600/10 px-2 py-0.5 rounded-full">
                        {distanceTo()?.toFixed(1)} mi
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar size={18} className="text-indigo-400" />
              Upcoming Events
            </h2>
            <button
              onClick={() => navigate('/events')}
              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hamptonRoadsPlaces
              .filter((p) => p.type === 'event')
              .slice(0, 6)
              .map((place) => (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-indigo-500/30 transition-colors cursor-pointer"
                  onClick={() => navigate('/explore', { state: { placeId: place.id } })}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl">{place.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{place.name}</p>
                      <p className="text-xs text-slate-500 truncate">{place.address}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Map size={18} className="text-indigo-400" />
              Browse by Interest
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => navigate('/explore', { state: { tag: tag.id } })}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center hover:border-indigo-500/30 transition-colors"
              >
                <div className="text-2xl mb-2">{tag.icon}</div>
                <p className="text-xs font-bold text-slate-300">{tag.label}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
