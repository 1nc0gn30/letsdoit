import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, ChevronRight, ExternalLink } from 'lucide-react';
import { hamptonRoadsPlaces, availableTags } from '../data/places';
import SEO from '../components/SEO';
import { getGoogleMapsUrl, getPlaceCity, getPlaceDescription } from '../lib/placePresentation';

export default function Events() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const events = hamptonRoadsPlaces.filter((p) => p.type === 'event');
  const filtered = filter === 'all' ? events : events.filter((e) => e.tags.includes(filter as any));

  return (
    <>
      <SEO title="Events — Navi Hampton Roads" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Calendar size={24} className="text-indigo-400" />
            Events
          </h1>
          <span className="text-sm text-slate-500">{filtered.length} events</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${filter === 'all' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>All</button>
          {availableTags.map((tag) => (
            <button key={tag.id} onClick={() => setFilter(tag.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${filter === tag.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
              {tag.icon} {tag.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((place, i) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-colors cursor-pointer group"
              onClick={() => navigate('/explore', { state: { placeId: place.id } })}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-2xl">{place.emoji}</div>
                <div className="flex items-center gap-2">
                  <a
                    href={getGoogleMapsUrl(place)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="p-2 rounded-lg bg-slate-800 text-slate-500 hover:text-indigo-300 hover:bg-slate-700 transition-colors"
                    aria-label={`Open ${place.name} in Google Maps`}
                  >
                    <ExternalLink size={14} />
                  </a>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors mt-1" />
                </div>
              </div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-300/80">{getPlaceCity(place)}</div>
              <h3 className="font-bold text-white mb-2 leading-tight">{place.name}</h3>
              <p className="text-sm text-slate-400 mb-3 leading-relaxed">{getPlaceDescription(place)}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={12} />
                {place.address}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {place.tags.map((tagId) => {
                  const tagObj = availableTags.find((t) => t.id === tagId);
                  return tagObj ? (
                    <span key={tagId} className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-bold">{tagObj.label}</span>
                  ) : null;
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
