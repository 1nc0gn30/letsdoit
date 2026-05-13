import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Navigation, ArrowLeft, ExternalLink, Compass, Info } from 'lucide-react';
import { hamptonRoadsPlaces, availableTags } from '../data/places';
import SEO from '../components/SEO';
import {
  getAppleMapsUrl,
  getGoogleDirectionsUrl,
  getGoogleMapsUrl,
  getPlaceCity,
  getPlaceDescription,
  getPlaceTypeLabel,
} from '../lib/placePresentation';

export default function PlaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const place = hamptonRoadsPlaces.find((p) => p.id === id);

  if (!place) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500">Place not found.</p>
        <button onClick={() => navigate('/explore')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Back to Explore</button>
      </div>
    );
  }

  return (
    <>
      <SEO title={`${place.name} — Navi Hampton Roads`} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6">
          <ArrowLeft size={16} /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-5">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-4xl border border-slate-700">{place.emoji}</div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-300 border border-indigo-500/20">
                  {getPlaceTypeLabel(place)}
                </span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-slate-700">
                  {getPlaceCity(place)}
                </span>
              </div>
              <h1 className="text-3xl font-black text-white mb-2">{place.name}</h1>
              <p className="text-slate-300 leading-relaxed">{getPlaceDescription(place)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <MapPin size={14} />
            {place.address}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {place.tags.map((tagId) => {
              const tagObj = availableTags.find((t) => t.id === tagId);
              return tagObj ? (
                <span key={tagId} className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                  {tagObj.icon} {tagObj.label}
                </span>
              ) : null;
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                <Compass size={14} /> Coordinates
              </div>
              <p className="text-sm text-slate-300">{place.lat.toFixed(5)}, {place.lng.toFixed(5)}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 sm:col-span-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                <Info size={14} /> Best For
              </div>
              <p className="text-sm text-slate-300">{place.tags.map((tag) => availableTags.find((t) => t.id === tag)?.label || tag).join(', ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a href={getGoogleDirectionsUrl(place)} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
            >
              <Navigation size={16} />
              Navigate
            </a>
            <a href={getGoogleMapsUrl(place)} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
            >
              <ExternalLink size={16} />
              Google Search
            </a>
            <a href={getAppleMapsUrl(place)} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
            >
              <ExternalLink size={16} />
              Apple Maps
            </a>
          </div>
        </motion.div>
      </div>
    </>
  );
}
