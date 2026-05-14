import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, Clock, MapPin, ArrowRight, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { Place } from '../data/places';
import { fetchRoute, formatDistance, formatDuration, RouteResult } from '../lib/directions';

interface DirectionsPanelProps {
  place: Place;
  userLocation: [number, number] | null;
  onClose?: () => void;
  onArrived?: () => void;
}

export default function DirectionsPanel({ place, userLocation, onClose, onArrived }: DirectionsPanelProps) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!userLocation) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    async function load() {
      const loc = userLocation;
      if (!loc) { setLoading(false); return; }
      if (!userLocation) { setLoading(false); return; }
      setLoading(true);
      setError(null);
      const result = await fetchRoute(loc, [place.lat, place.lng]);
      if (cancelled) return;
      if (!result) {
        setError('Unable to load turn-by-turn directions. Try an external map app below.');
      } else {
        setRoute(result);
        setActiveStep(0);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [userLocation, place.lat, place.lng]);

  if (!userLocation) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 text-amber-400 mb-4">
          <AlertTriangle size={20} />
          <span className="font-bold text-sm">Location Required</span>
        </div>
        <p className="text-slate-400 text-sm mb-4">Enable location services to get in-app directions.</p>
        {onClose && (
          <button onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors">Close</button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600/20 text-indigo-400 rounded-lg flex items-center justify-center">
              <Navigation size={16} />
            </div>
            <span className="font-bold text-white">Directions to {place.name}</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800">Close</button>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
            Calculating route...
          </div>
        )}

        {error && !route && (
          <div className="flex items-center gap-2 text-amber-400 text-xs mt-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {route && (
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Navigation size={13} className="text-indigo-400" />
              <span className="font-bold">{formatDistance(route.distance)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Clock size={13} className="text-indigo-400" />
              <span className="font-bold">{formatDuration(route.duration)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <MapPin size={13} className="text-indigo-400" />
              <span className="font-bold">{route.legs[0]?.steps.length ?? 0} steps</span>
            </div>
          </div>
        )}
      </div>

      {/* Steps */}
      {route && (
        <div className="max-h-72 overflow-y-auto">
          <AnimatePresence>
            {route.legs.flatMap((leg, li) =>
              leg.steps.map((step, si) => {
                const globalIdx = route.legs.slice(0, li).reduce((a, l) => a + l.steps.length, 0) + si;
                const isActive = globalIdx === activeStep;
                const isPast = globalIdx < activeStep;
                return (
                  <motion.div
                    key={`${li}-${si}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: isPast ? 0.4 : 1, x: 0 }}
                    className={`flex items-start gap-3 p-3 border-b border-slate-800/50 transition-colors ${isActive ? 'bg-indigo-600/10' : 'hover:bg-slate-800/30'}`}
                    onClick={() => setActiveStep(globalIdx)}
                  >
                    <div className="flex flex-col items-center mt-0.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-indigo-600 text-white' : isPast ? 'bg-slate-700 text-slate-400' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                        {globalIdx + 1}
                      </div>
                      {si < leg.steps.length - 1 && (
                        <div className={`w-0.5 h-full min-h-[20px] mt-1 ${isPast ? 'bg-indigo-600/30' : 'bg-slate-700'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-snug ${isActive ? 'text-white' : 'text-slate-300'}`}>{step.instruction}</p>
                      {step.name && step.name !== step.instruction && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{step.name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-bold">{formatDistance(step.distance)}</span>
                        <span className="text-[10px] text-slate-600">{formatDuration(step.duration)}</span>
                      </div>
                    </div>
                    <div className="mt-0.5">
                      <ArrowRight size={14} className={`${isActive ? 'text-indigo-400' : 'text-slate-600'}`} />
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
        {route && route.legs[0]?.steps.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? <><ChevronUp size={14} /> Collapse</> : <><ChevronDown size={14} /> Expand all steps</>}
          </button>
        )}
        {onArrived && (
          <button
            onClick={onArrived}
            className="ml-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <MapPin size={14} />
            I've Arrived
          </button>
        )}
      </div>
    </motion.div>
  );
}
