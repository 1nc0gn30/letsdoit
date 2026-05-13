import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

import { Place } from '../data/places';

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface MapViewerProps {
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (id: string) => void;
  userLocation: [number, number] | null;
}

export default function MapViewer({ places, selectedPlaceId, onSelectPlace, userLocation }: MapViewerProps) {
  const defaultCenter: [number, number] = [36.8529, -76.2840]; 
  const [center, setCenter] = useState<[number, number]>(defaultCenter);
  const [zoom, setZoom] = useState(11);

  const selectedPlace = selectedPlaceId ? places.find(p => p.id === selectedPlaceId) : null;

  // Simple haversine-like distance calculation
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (userLocation && selectedPlace) {
      const R = 3958.8; // Radius of the Earth in miles
      const lat1 = userLocation[0] * Math.PI / 180;
      const lat2 = selectedPlace.lat * Math.PI / 180;
      const dLat = (selectedPlace.lat - userLocation[0]) * Math.PI / 180;
      const dLon = (selectedPlace.lng - userLocation[1]) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      setDistance(R * c);
    } else {
      setDistance(null);
    }
  }, [userLocation, selectedPlace]);

  useEffect(() => {
    if (selectedPlace) {
      setCenter([selectedPlace.lat, selectedPlace.lng]);
      setZoom(14);
    }
  }, [selectedPlace]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <ChangeView center={center} zoom={zoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <Marker 
            position={userLocation} 
            icon={L.divIcon({
              className: 'bg-transparent',
              html: `<div class="flex items-center justify-center w-6 h-6 bg-blue-600 border-2 border-white rounded-full shadow-lg shadow-blue-500/50 relative"><div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })}
          >
            <Popup>
              <div className="font-medium text-slate-800">You are here</div>
            </Popup>
          </Marker>
        )}

        {/* Navigation In-House Line */}
        {userLocation && selectedPlace && (
          <Polyline 
            positions={[userLocation, [selectedPlace.lat, selectedPlace.lng]]} 
            pathOptions={{ 
              color: '#4f46e5', 
              weight: 3, 
              dashArray: '10, 10', 
              opacity: 0.6 
            }} 
          />
        )}

        {places.map((place) => {
          const isSelected = selectedPlaceId === place.id;
          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={L.divIcon({
                className: 'bg-transparent',
                html: `<div class="flex items-center justify-center w-8 h-8 bg-white border-2 ${isSelected ? 'border-indigo-600 scale-125' : 'border-slate-200'} rounded-full shadow-md transition-all text-lg hover:scale-110 active:scale-95 cursor-pointer">${place.emoji}</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32] // Anchor bottom center
              })}
              eventHandlers={{
                click: () => onSelectPlace(place.id),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[220px]">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1 opacity-70">
                    {place.type === 'event' ? '🎟️ Event' : '📍 Place'}
                  </div>
                  <h3 className="font-bold text-slate-900 leading-tight mb-1 text-base">{place.name}</h3>
                  <p className="text-xs text-slate-500 mb-3">{place.address}</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-xl transition-colors border border-slate-200"
                    >
                      <span>Google Maps</span>
                    </a>
                    <a 
                      href={`https://maps.apple.com/?daddr=${place.lat},${place.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-xl transition-colors border border-slate-200"
                    >
                      <span>Apple Maps</span>
                    </a>
                  </div>
                  
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                  >
                    <Navigation size={14} className="fill-current" />
                    <span>In-House Navigate</span>
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Distance Overlay */}
      {distance && selectedPlace && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none w-full max-w-xs px-4">
          <div className="bg-white/95 backdrop-blur-md border border-indigo-100 p-3 rounded-2xl shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center animate-pulse shadow-lg shadow-indigo-200">
              <Navigation size={18} className="fill-current" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">Target: {selectedPlace.name}</span>
              <span className="text-base font-black text-slate-800 leading-none">{distance.toFixed(1)} miles away</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
