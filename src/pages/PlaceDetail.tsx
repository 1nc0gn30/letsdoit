import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Navigation, ArrowLeft, ExternalLink } from 'lucide-react';
import { hamptonRoadsPlaces, availableTags } from '../data/places';
import SEO from '../components/SEO';

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
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-4xl mb-4">{place.emoji}</div>
          <h1 className="text-3xl font-black text-white mb-2">{place.name}</h1>
          <p className="text-slate-400 mb-4">{place.description}</p>

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

          <div className="grid grid-cols-2 gap-3">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
            >
              <Navigation size={16} />
              Navigate
            </a>
            <a href={`https://maps.apple.com/?daddr=${place.lat},${place.lng}`} target="_blank" rel="noopener noreferrer"
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
