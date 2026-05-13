import { useState, useEffect, useCallback } from 'react';
import { Compass, Filter, X, Sparkles, User, Menu } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { hamptonRoadsPlaces, availableTags, Place, Tag } from './data/places';
import { pickSuggestion, computeCredibilityDelta } from './lib/suggestionEngine';
import MapViewer from './components/MapViewer';
import Onboarding from './components/Onboarding';
import SuggestionCard, { SuggestionCardProps } from './components/SuggestionCard';
import ProfilePanel from './components/ProfilePanel';
import { createUserVisit, updateUserVisit, getUserVisits, submitUserFeedback } from './lib/visitService';
import { adjustCredibility, adjustStreak } from './lib/profileService';

export default function App() {
  const { user, profile, loading: authLoading, token, refreshProfile } = useAuth();
  const [places] = useState<Place[]>(hamptonRoadsPlaces);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>(places);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [suggestionPhase, setSuggestionPhase] = useState<'idle' | 'prompt' | 'suggesting' | 'accepted' | 'checked_in' | 'rated'>('idle');
  const [suggestedPlace, setSuggestedPlace] = useState<Place | null>(null);
  const [currentVisitId, setCurrentVisitId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ place_id: string; status: string }[]>([]);

  // Load preferences from profile
  useEffect(() => {
    if (profile?.preferences?.length) {
      setSelectedTags(profile.preferences as Tag[]);
    }
  }, [profile]);

  // Geolocation
  useEffect(() => {
    if ('geolocation' in navigator && user) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [user]);

  // Filter places
  useEffect(() => {
    if (selectedTags.length > 0) {
      setFilteredPlaces(places.filter((p) => p.tags.some((t) => selectedTags.includes(t))));
    } else {
      setFilteredPlaces(places);
    }
  }, [selectedTags, places]);

  // Load visit history for scoring
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
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    [userLocation]
  );

  const generateSuggestion = useCallback(() => {
    const visitedIds = history.filter((h) => h.status === 'checked_in').map((h) => h.place_id);
    const skippedIds = history.filter((h) => h.status === 'skipped' || h.status === 'declined').map((h) => h.place_id);
    const prefs = selectedTags.length > 0 ? selectedTags : (profile?.preferences as Tag[] ?? []);
    const place = pickSuggestion(places, prefs, userLocation, [], skippedIds, visitedIds);
    setSuggestedPlace(place);
    setSuggestionPhase('suggesting');
    if (place && token) {
      createUserVisit(token, place.id, 'suggested').then(({ visit }) => {
        if (visit) setCurrentVisitId(visit.id);
      });
    }
  }, [places, selectedTags, profile, userLocation, history, token]);

  const handleReadyPromptAccept = () => {
    generateSuggestion();
  };

  const handleReadyPromptDecline = () => {
    setSuggestionPhase('idle');
  };

  const handleSuggestionAccept = async () => {
    if (!suggestedPlace || !token || !currentVisitId) return;
    await updateUserVisit(token, currentVisitId, { status: 'accepted' });
    setSuggestionPhase('accepted');
    setSelectedPlaceId(suggestedPlace.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSuggestionDecline = async () => {
    if (!token || !suggestedPlace) {
      setSuggestionPhase('idle');
      return;
    }
    if (currentVisitId) {
      await updateUserVisit(token, currentVisitId, { status: 'declined' });
    }
    const delta = computeCredibilityDelta('declined');
    await adjustCredibility(token, delta);
    await refreshProfile();
    setSuggestionPhase('idle');
  };

  const handleSkip = async () => {
    if (!token || !suggestedPlace || !currentVisitId) {
      setSuggestionPhase('idle');
      return;
    }
    await updateUserVisit(token, currentVisitId, { status: 'skipped' });
    const delta = computeCredibilityDelta('skipped');
    await adjustCredibility(token, delta);
    await adjustStreak(token, true);
    await refreshProfile();
    setSuggestionPhase('idle');
  };

  const handleCheckIn = async () => {
    if (!token || !suggestedPlace || !currentVisitId) return;
    await updateUserVisit(token, currentVisitId, { status: 'checked_in' });
    setSuggestionPhase('checked_in');
  };

  const handleRate = async (liked: boolean) => {
    if (!token || !suggestedPlace || !currentVisitId) return;
    await updateUserVisit(token, currentVisitId, { liked, disliked: !liked });
    await submitUserFeedback(token, suggestedPlace.id, liked);
    const delta = computeCredibilityDelta('went', liked);
    await adjustCredibility(token, delta);
    if (liked) await adjustStreak(token, false);
    await refreshProfile();
    setSuggestionPhase('rated');
  };

  const handleDismissRated = () => {
    setSuggestionPhase('idle');
    setSuggestedPlace(null);
    setCurrentVisitId(null);
  };

  const resolveCardProps = (): SuggestionCardProps | null => {
    if (suggestionPhase === 'prompt') {
      return {
        phase: 'prompt' as const,
        place: null,
        onAccept: handleReadyPromptAccept,
        onDecline: handleReadyPromptDecline,
        onCheckIn: () => {},
        onRate: (_liked: boolean) => {},
        onDismiss: () => {},
        distance: null,
      };
    }
    if (suggestionPhase === 'suggesting') {
      return {
        phase: 'suggesting' as const,
        place: suggestedPlace,
        onAccept: handleSuggestionAccept,
        onDecline: handleSuggestionDecline,
        onCheckIn: () => {},
        onRate: (_liked: boolean) => {},
        onDismiss: () => {},
        distance: distanceTo(suggestedPlace),
      };
    }
    if (suggestionPhase === 'accepted') {
      return {
        phase: 'accepted' as const,
        place: suggestedPlace,
        onAccept: handleCheckIn,
        onDecline: handleSkip,
        onCheckIn: () => {},
        onRate: (_liked: boolean) => {},
        onDismiss: () => {},
        distance: distanceTo(suggestedPlace),
      };
    }
    if (suggestionPhase === 'checked_in') {
      return {
        phase: 'checked_in' as const,
        place: suggestedPlace,
        onAccept: () => {},
        onDecline: () => {},
        onCheckIn: () => {},
        onRate: handleRate,
        onDismiss: () => {},
        distance: null,
      };
    }
    if (suggestionPhase === 'rated') {
      return {
        phase: 'rated' as const,
        place: null,
        onAccept: () => {},
        onDecline: () => {},
        onCheckIn: () => {},
        onRate: (_liked: boolean) => {},
        onDismiss: handleDismissRated,
        distance: null,
      };
    }
    return null;
  };

  const cardProps = resolveCardProps();

  const handleSelectPlace = (id: string) => {
    setSelectedPlaceId(id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const toggleTag = (tagId: Tag) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Onboarding onComplete={async () => { await refreshProfile(); }} />;
  }

  // If profile exists but has no preferences, show onboarding step 2
  if (profile && (!profile.preferences || profile.preferences.length === 0)) {
    return <Onboarding onComplete={async () => { await refreshProfile(); }} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-100 overflow-hidden font-sans">
      <ProfilePanel isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {cardProps && <SuggestionCard {...cardProps} />}

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:relative z-50 w-full sm:w-96 md:w-96 h-[60vh] md:h-full bottom-0 md:bottom-auto bg-white border-t md:border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen
            ? 'translate-y-0 md:translate-none md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:-translate-x-full md:translate-x-0'
        } flex flex-col`}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <Compass className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Navi</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <User size={18} />
            </button>
            <button
              className="md:hidden p-2 -mr-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-4">
          <div className="h-10 w-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold relative">
            {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">Hey, {profile?.display_name || user.email?.split('@')[0]}!</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">⭐ {profile?.credibility_score ?? 100} Credibility</span>
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🔥 {profile?.streak ?? 0} Streak</span>
            </div>
          </div>
          <button
            onClick={() => setSuggestionPhase('prompt')}
            className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all"
          >
            <Sparkles size={18} />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 overflow-x-auto flex gap-2 scrollbar-hide">
          <button
            onClick={() => setSelectedTags([])}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
              selectedTags.length === 0
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            ALL
          </button>
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span>{tag.icon}</span>
                <span>{tag.label.toUpperCase()}</span>
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
                <div
                  key={place.id}
                  onClick={() => handleSelectPlace(place.id)}
                  className={`p-4 rounded-3xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10'
                      : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 flex-shrink-0 bg-slate-50 rounded-2xl flex items-center justify-center text-xl border border-slate-100">
                      {place.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 leading-tight mb-1 truncate">{place.name}</h3>
                      <p className="text-xs text-slate-500 mb-3 truncate">{place.address}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {place.tags.map((tagId) => {
                          const tagObj = availableTags.find((t) => t.id === tagId);
                          return tagObj ? (
                            <span
                              key={tagId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold tracking-tight"
                            >
                              {tagObj.label}
                            </span>
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
        <MapViewer
          places={filteredPlaces}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={setSelectedPlaceId}
          userLocation={userLocation}
        />

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-3">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden bg-slate-900 text-white px-5 py-3 rounded-full font-bold shadow-xl shadow-slate-900/20 flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
            >
              <Menu size={18} />
              <span>List</span>
            </button>
          )}
          <button
            onClick={() => setSuggestionPhase('prompt')}
            className="bg-indigo-600 text-white px-5 py-3 rounded-full font-bold shadow-xl shadow-indigo-900/20 flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
          >
            <Sparkles size={18} />
            <span>Ready?</span>
          </button>
        </div>
      </main>
    </div>
  );
}
