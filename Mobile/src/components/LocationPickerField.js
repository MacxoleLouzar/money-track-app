import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet, Modal, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, shared } from '../utils/theme';

export default function LocationPickerField({ field, value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const debounceRef = useRef(null);

  const search = async (q) => {
    if (!q || q.length < 3) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'MoneyTrackApp/1.0' } }
      );
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (text) => {
    setQuery(text);
    onChange(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 600);
  };

  const handleSelect = (place) => {
    const name = place.display_name.split(',').slice(0, 3).join(', ');
    setQuery(name);
    setSelected({ lat: place.lat, lon: place.lon, name });
    setResults([]);
    onChange(name);
  };

  const openMap = () => {
    if (selected) {
      Linking.openURL(`https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lon}#map=15/${selected.lat}/${selected.lon}`);
    }
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={shared.label}>{field.label}</Text>

      {/* Search input */}
      <View style={styles.inputRow}>
        <Ionicons name="location-outline" size={18} color={COLORS.primary} style={styles.icon} />
        <TextInput
          style={[shared.input, styles.input]}
          value={query}
          onChangeText={handleChange}
          placeholder={`Search ${field.label}...`}
          placeholderTextColor={COLORS.textMuted}
          autoCorrect={false}
        />
        {query ? (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSelected(null); onChange(''); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Search results */}
      {searching && (
        <View style={styles.dropdownItem}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={{ color: COLORS.textMuted, marginLeft: 8 }}>Searching...</Text>
        </View>
      )}

      {!searching && results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map(place => (
            <TouchableOpacity
              key={place.place_id}
              style={styles.dropdownItem}
              onPress={() => handleSelect(place)}
            >
              <Ionicons name="location" size={14} color={COLORS.primary} style={{ marginTop: 2 }} />
              <Text style={styles.dropdownText} numberOfLines={2}>
                {place.display_name.split(',').slice(0, 4).join(', ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Selected location chip with map link */}
      {selected && (
        <TouchableOpacity style={styles.selectedChip} onPress={openMap}>
          <Ionicons name="map" size={14} color={COLORS.primary} />
          <Text style={styles.selectedText} numberOfLines={1}>{selected.name}</Text>
          <Ionicons name="open-outline" size={13} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: COLORS.white,
  },
  icon: { marginRight: 6 },
  input: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    marginTop: 4,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  selectedText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
