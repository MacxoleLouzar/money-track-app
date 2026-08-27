import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X } from 'lucide-react';

/**
 * LocationPicker — search for a place using OpenStreetMap Nominatim (free, no key).
 * Shows a map preview using an OpenStreetMap iframe embed.
 * Works on both mobile and desktop.
 */
export default function LocationPicker({ label, name, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const debounceRef = useRef(null);

  // Pre-fill selected from value on edit
  useEffect(() => {
    if (value && !selected) setQuery(value);
  }, [value]);

  const search = (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`, {
      headers: { 'Accept-Language': 'en' },
    })
      .then(r => r.json())
      .then(data => setResults(data))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  };

  const handleQueryChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 500);
  };

  const handleSelect = (place) => {
    const displayName = place.display_name.split(',').slice(0, 3).join(', ');
    setSelected({ lat: place.lat, lon: place.lon, name: displayName });
    setQuery(displayName);
    setResults([]);
    onChange({ target: { name, value: displayName } });
    setOpen(false);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    onChange({ target: { name, value: '' } });
  };

  const mapUrl = selected
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(selected.lon) - 0.01},${Number(selected.lat) - 0.01},${Number(selected.lon) + 0.01},${Number(selected.lat) + 0.01}&layer=mapnik&marker=${selected.lat},${selected.lon}`
    : null;

  return (
    <div className="location-picker">
      <div className="location-input-row">
        <div style={{ position: 'relative', flex: 1 }}>
          <MapPin size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '2.1rem', paddingRight: value ? '2rem' : '0.9rem' }}
            placeholder={`Search ${label}...`}
            value={query}
            onChange={handleQueryChange}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={handleClear}
              style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0.2rem' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown results */}
      {open && (query.length > 1) && (
        <div className="location-dropdown">
          {searching && <div className="location-dropdown-item" style={{ color: '#9ca3af' }}>Searching...</div>}
          {!searching && results.length === 0 && query.length > 2 && (
            <div className="location-dropdown-item" style={{ color: '#9ca3af' }}>No results found</div>
          )}
          {results.map(place => (
            <button key={place.place_id} type="button" className="location-dropdown-item"
              onClick={() => handleSelect(place)}>
              <MapPin size={13} style={{ flexShrink: 0, color: '#a8d8ea' }} />
              <span>{place.display_name.split(',').slice(0, 4).join(', ')}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map preview */}
      {selected && mapUrl && (
        <div className="location-map-preview">
          <iframe
            title={`Map for ${label}`}
            src={mapUrl}
            style={{ width: '100%', height: '160px', border: 'none', borderRadius: '0.5rem' }}
            loading="lazy"
          />
          <div className="location-map-label">
            <MapPin size={13} color="#a8d8ea" /> {selected.name}
          </div>
        </div>
      )}
    </div>
  );
}
