import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Loader2, MapPin, Crosshair } from 'lucide-react';
import { toast } from 'sonner';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LEBANON_CENTER: [number, number] = [33.8938, 35.5018];

interface Props {
  position: { lat: number; lng: number } | null;
  onPositionChange: (pos: { lat: number; lng: number }) => void;
  height?: string;
}

function MapController({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15), { animate: true });
    }
  }, [position, map]);
  return null;
}

function DraggableMarker({ position, onPositionChange }: Props) {
  const markerRef = useRef<L.Marker>(null);
  const [draggedPos, setDraggedPos] = useState(position);

  useEffect(() => {
    setDraggedPos(position);
  }, [position]);

  useMapEvents({
    click(e) {
      const pos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setDraggedPos(pos);
      onPositionChange(pos);
    },
  });

  if (!draggedPos) return null;

  return (
    <Marker
      ref={markerRef}
      position={[draggedPos.lat, draggedPos.lng]}
      draggable
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker) {
            const latlng = marker.getLatLng();
            const pos = { lat: latlng.lat, lng: latlng.lng };
            setDraggedPos(pos);
            onPositionChange(pos);
          }
        },
      }}
    />
  );
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
      { headers: { 'User-Agent': 'CoffeeCraze/1.0' } }
    );
    const data = await res.json();
    if (data?.display_name) {
      const parts = data.display_name.split(', ');
      return parts.slice(0, 4).join(', ');
    }
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function LocationPicker({ position, onPositionChange, height = '250px' }: Props) {
  const [locating, setLocating] = useState(false);
  const [addressLabel, setAddressLabel] = useState<string>('');

  useEffect(() => {
    if (position) {
      setAddressLabel('');
      reverseGeocode(position.lat, position.lng).then(setAddressLabel);
    } else {
      setAddressLabel('');
    }
  }, [position]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onPositionChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Live location pinned! Drag the marker to fine-tune.');
        setLocating(false);
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: 'Location permission denied. Please enable GPS in your browser settings.',
          2: 'GPS position unavailable. Try again or pin the location manually.',
          3: 'GPS request timed out. Check your connection and try again.',
        };
        toast.error(msgs[err.code] || 'Could not get location. Please allow location access.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const handleLocateBeirut = () => {
    onPositionChange({ lat: 33.8938, lng: 35.5018 });
    toast.info('Pinned Beirut city center. Drag the marker to your exact location.');
  };

  const defaultCenter: [number, number] = position
    ? [position.lat, position.lng]
    : LEBANON_CENTER;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Delivery Location Pin</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLocateBeirut}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-espresso/5 border border-espresso/20 rounded-lg text-[11px] font-bold text-espresso hover:bg-espresso/10 transition-all"
          >
            <MapPin size={14} />
            Center Map
          </button>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={locating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-espresso text-white rounded-lg text-[11px] font-bold hover:bg-caramel transition-all disabled:opacity-50"
          >
            {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
            {locating ? 'Locating...' : 'Use My Location'}
          </button>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden border border-espresso/10 shadow-sm" style={{ height }}>
        <MapContainer
          center={defaultCenter}
          zoom={position ? 15 : 8}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController position={position} />
          <DraggableMarker position={position} onPositionChange={onPositionChange} />
        </MapContainer>
      </div>
      {position && (
        <div className="space-y-1">
          <p className="text-[11px] text-green-700 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          </p>
          {addressLabel && (
            <p className="text-[11px] text-text-muted flex items-start gap-1.5">
              <MapPin size={12} className="mt-0.5 flex-shrink-0" />
              {addressLabel}
            </p>
          )}
        </div>
      )}
      {!position && (
        <p className="text-[11px] text-text-muted italic flex items-center gap-1">
          <MapPin size={12} />
          Click on the map or use "Use My Location" to pin your delivery address
        </p>
      )}
    </div>
  );
}
