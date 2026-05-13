import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Filter, X, Sparkles, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hamptonRoadsPlaces, availableTags, Place, Tag } from '../data/places';
import { pickSuggestion, computeCredibilityDelta } from '../lib/suggestionEngine';
import MapViewer from '../components/MapViewer';
import SuggestionCard from '../components/SuggestionCard';
import ProfilePanel from '../components/ProfilePanel';
import { createUserVisit, updateUserVisit, getUserVisits, submitUserFeedback } from '../lib/visitService';
import { adjustCredibility, adjustStreak } from '../lib/profileService';
import SEO from '../components/SEO';

export default function Explore() {
  const { user, profile, token, refreshProfile } = useAuth();
  const location = useLocation();
  const initialPlaceId = (location.state as any)?.placeId as string | undefined;
  const initialTag = (location.state as any)?.tag as Tag | undefined;

  const [places] = useState<Place[]>(hamptonRoadsPlaces);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTag ? [initialTag] : []);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>(places);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(initialPlaceId || null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'prompt' | 'suggesting' | 'accepted' | 'checked_in' | 'rated'>('idle');
  const [suggestedPlace, setSuggestedPlace] = useState<Place | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ place_id: string; status: string }[]>([]);

  useEffect(() => {
    if (profile?.preferences?.length && selectedTags.length === 0 && !initialTag) {
      setSelectedTags(profile.preferences as Tag[]);
    }
  }, [profile, initialTag]);

  useEffect(() => {
    if ('geolocation' in navigator && user) {
      const w = navigator.geolocation.watchPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(w);
    }
  }, [user]);

  useEffect(() => {
    if (selectedTags.length > 0) {
      setFilteredPlaces(places.filter((p) => p.tags.some((t) => selectedTags.includes(t))));
    } else {
      setFilteredPlaces(places);
    }
  }, [selectedTags, places]);

  useEffect(() => {
    if (!token) return;
    getUserVisits(token).then(({ visits }) => {
      setHistory(visits.map((v) => ({ place_id: v.place_id, status: v.status })));
    });
  }, [token]);

  const distanceTo = useCallback(
    (place: Place | null) => {
      if (!userLocation || !place) return null;
      const R = 3958.8;
      const dLat = ((place.lat - userLocation[0]) * Math.PI) / 180;
      const dLon = ((place.lng - userLocation[1]) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLocation[0] * Math.PI) / 180) *
          Math.cos((place.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },
    [userLocation]
  );

  const generate = useCallback(() => {
    const visited = history.filter((h) => h.status === 'checked_in').map((h) => h.place_id);
    const skipped = history.filter((h) => h.status === 'skipped' || h.status === 'declined').map((h) => h.place_id);
    const prefs = selectedTags.length > 0 ? selectedTags : (profile?.preferences as Tag[] ?? []);
    const place = pickSuggestion(places, prefs, userLocation, [], skipped, visited);
    setSuggestedPlace(place);
    setVisitId(null);
    setPhase('suggesting');
  }, [places, selectedTags, profile, userLocation, history]);

  const handleReady = () => setPhase('prompt');

  const handleAccept = async () => {
    if (!suggestedPlace || !token) return;
    const id = visitId || (await createUserVisit(token, suggestedPlace.id, 'accepted')).data?.id;
    if (!id) return;
    setVisitId(id);
    if (visitId) {
      await updateUserVisit(token, id, { status: 'accepted' });
    }
    setPhase('accepted');
    setSelectedPlaceId(suggestedPlace.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDecline = async () => {
    if (!token || !suggestedPlace) { setPhase('idle'); return; }
    if (visitId) {
      await updateUserVisit(token, visitId, { status: 'declined' });
    } else {
      await createUserVisit(token, suggestedPlace.id, 'declined');
    }
    await adjustCredibility(token, computeCredibilityDelta('declined'));
    await refreshProfile();
    setPhase('idle');
  };

  const handleSkip = async () => {
    if (!token || !suggestedPlace || !visitId) { setPhase('idle'); return; }
    await updateUserVisit(token, visitId, { status: 'skipped' });
    await adjustCredibility(token, computeCredibilityDelta('skipped'));
    await adjustStreak(token, true);
    await refreshProfile();
    setPhase('idle');
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

  const handleDismiss = () => { setPhase('idle'); setSuggestedPlace(null); setVisitId(null); };

  const toggleTag = (tagId: Tag) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const cardProps = (() => {
    if (phase === 'prompt') return { phase: 'prompt' as const, place: null, onAccept: generate, onDecline: handleDismiss, onCheckIn: () => {}, onRate: () => {}, onDismiss: handleDismiss, distance: null };
    if (phase === 'suggesting') return { phase: 'suggesting' as const, place: suggestedPlace, onAccept: handleAccept, onDecline: handleDecline, onCheckIn: () => {}, onRate: () => {}, onDismiss: handleDismiss, distance: distanceTo(suggestedPlace) };
    if (phase === 'accepted') return { phase: 'accepted' as const, place: suggestedPlace, onAccept: handleCheckIn, onDecline: handleSkip, onCheckIn: () => {}, onRate: () => {}, onDismiss: handleDismiss, distance: distanceTo(suggestedPlace) };
    if (phase === 'checked_in') return { phase: 'checked_in' as const, place: suggestedPlace, onAccept: () => {}, onDecline: () => {}, onCheckIn: () => {}, onRate: handleRate, onDismiss: handleDismiss, distance: null };
    if (phase === 'rated') return { phase: 'rated' as const, place: null, onAccept: () => {}, onDecline: () => {}, onCheckIn: () => {}, onRate: () => {}, onDismiss: handleDismiss, distance: null };
    return null;
  })();

  return (
    <>
      <SEO title="Explore — Navi Hampton Roads" />
      <div className="flex flex-col md:flex-row h-[calc(100vh-3.5rem)] w-full bg-slate-100 overflow-hidden font-sans">
        <ProfilePanel isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        {cardProps && <SuggestionCard {...cardProps} />}

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/20 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        <aside className={`fixed md:relative z-50 w-full sm:w-96 md:w-96 h-[60vh] md:h-full bottom-0 md:bottom-auto bg-white border-t md:border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:-translate-x-full'} flex flex-col`}>
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-600">
              <Sparkles className="w-6 h-6" />
              <h1 className="text-xl font-bold tracking-tight text-slate-800">Explore</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsProfileOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"><User size={18} /></button>
              <button className="md:hidden p-2 -mr-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
            </div>
          </div>

          <div className="px-6 py-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-4">
            <div className="h-10 w-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold relative">
              {profile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Hey, {profile?.display_name || user?.email?.split('@')[0]}!</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">⭐ {profile?.credibility_score ?? 100}</span>
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🔥 {profile?.streak ?? 0}</span>
              </div>
            </div>
            <button onClick={handleReady} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all"><Sparkles size={18} /></button>
          </div>

          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 overflow-x-auto flex gap-2 no-scrollbar">
            <button onClick={() => setSelectedTags([])} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${selectedTags.length === 0 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>ALL</button>
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button key={tag.id} onClick={() => toggleTag(tag.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  <span>{tag.icon}</span><span>{tag.label.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between mb-2 px-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recommended</h2>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{filteredPlaces.length} MATCHES</span>
            </div>
            <div className="space-y-3 pb-8">
              {filteredPlaces.map((place) => {
                const isSelected = selectedPlaceId === place.id;
                return (
                  <div key={place.id} onClick={() => { setSelectedPlaceId(place.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                    className={`p-4 rounded-3xl cursor-pointer transition-all border ${isSelected ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'}`}
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 flex-shrink-0 bg-slate-50 rounded-2xl flex items-center justify-center text-xl border border-slate-100">{place.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 leading-tight mb-1 truncate">{place.name}</h3>
                        <p className="text-xs text-slate-500 mb-3 truncate">{place.address}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {place.tags.map((tagId) => {
                            const tagObj = availableTags.find((t) => t.id === tagId);
                            return tagObj ? (
                              <span key={tagId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold tracking-tight">{tagObj.label}</span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredPlaces.length === 0 && (
                <div className="text-center py-10 px-4">
                  <Filter className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No matches for your current filters. Try selecting different interests.</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 h-full relative z-0">
          <MapViewer places={filteredPlaces} selectedPlaceId={selectedPlaceId} onSelectPlace={setSelectedPlaceId} userLocation={userLocation} />
          {!isSidebarOpen && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden bg-slate-900 text-white px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 active:scale-95 transition-transform"
>
                <Sparkles size={18} />
                <span>List</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
