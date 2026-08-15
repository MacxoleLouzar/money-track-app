import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_URL, authHeaders } from '../utils/api';
import { COLORS, shared } from '../utils/theme';
import BottomSheet from '../components/BottomSheet';
import FormField from '../components/FormField';
import BarcodeScanner from '../components/BarcodeScanner';

const PAGE_SIZE = 10;

export default function ExpenseScreen({ category, title, fields }) {
  const { token } = useAuth();
  const API = `${API_URL}/expenses`;

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showScanner, setShowScanner] = useState(false);

  const fetchExpenses = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API}/${category}`, { headers: authHeaders(token) });
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
      setPage(1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, token]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const openAdd = () => {
    setEditing(null);
    setForm({ date: new Date().toISOString().split('T')[0] });
    setShowForm(true);
  };

  const openEdit = (exp) => {
    setEditing(exp);
    setForm({ ...exp, date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0] });
    setShowForm(true);
  };

  const handleScan = async (value) => {
    setShowScanner(false);
    const prefill = { barcode: value, date: new Date().toISOString().split('T')[0] };
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${value}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const name = [p.brands, p.product_name].filter(Boolean).join(' - ');
        const firstText = fields.find(f => !f.type || f.type === 'text');
        if (firstText) prefill[firstText.name] = name;
        if (fields.find(f => f.name === 'store') && p.stores) prefill.store = p.stores.split(',')[0].trim();
      } else {
        const firstText = fields.find(f => !f.type || f.type === 'text');
        if (firstText) prefill[firstText.name] = value;
      }
    } catch {
      const firstText = fields.find(f => !f.type || f.type === 'text');
      if (firstText) prefill[firstText.name] = value;
    }
    setEditing(null);
    setForm(prefill);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    const url = editing ? `${API}/${category}/${editing._id}` : `${API}/${category}`;
    const method = editing ? 'PUT' : 'POST';
    await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(form) });
    setSaving(false);
    setShowForm(false);
    fetchExpenses(true);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await fetch(`${API}/${category}/${id}`, { method: 'DELETE', headers: authHeaders(token) });
          fetchExpenses(true);
        }
      },
    ]);
  };

  const filtered = expenses.filter(exp => {
    if (!search) return true;
    const q = search.toLowerCase();
    return fields.some(f => String(exp[f.name] ?? '').toLowerCase().includes(q));
  });

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={{ flex: 1 }}>
        {fields.filter(f => f.name !== 'barcode').slice(0, 3).map(f => (
          <Text key={f.name} style={styles.itemText}>
            <Text style={styles.itemLabel}>{f.label}: </Text>
            {f.name === 'price' ? `R ${Number(item[f.name] || 0).toFixed(2)}` : String(item[f.name] ?? '—')}
          </Text>
        ))}
        {item.date && <Text style={styles.itemDate}>{new Date(item.date).toLocaleDateString()}</Text>}
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
          <Ionicons name="pencil" size={16} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: COLORS.dangerLight }]} onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={shared.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={v => { setSearch(v); setPage(1); }}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={paginated}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExpenses(); }} />}
          ListEmptyComponent={<Text style={shared.emptyText}>No {title.toLowerCase()} recorded yet.</Text>}
          ListFooterComponent={hasMore ? (
            <TouchableOpacity style={styles.loadMore} onPress={() => setPage(p => p + 1)}>
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Load more</Text>
            </TouchableOpacity>
          ) : null}
        />
      )}

      {/* FAB */}
      <View style={styles.fabRow}>
        <TouchableOpacity style={[styles.fab, styles.fabScan]} onPress={() => setShowScanner(true)}>
          <Ionicons name="scan" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={openAdd}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <BarcodeScanner visible={showScanner} onScan={handleScan} onClose={() => setShowScanner(false)} />

      <BottomSheet visible={showForm} title={editing ? `Edit ${title}` : `Add ${title}`} onClose={() => setShowForm(false)}>
        {fields.map(f => (
          <FormField key={f.name} field={f} value={form[f.name]} onChange={v => setForm(prev => ({ ...prev, [f.name]: v }))} />
        ))}
        {/* Date field */}
        <View style={{ marginBottom: 12 }}>
          <Text style={shared.label}>Date</Text>
          <TextInput
            style={shared.input}
            value={form.date || ''}
            onChangeText={v => setForm(prev => ({ ...prev, date: v }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
        <View style={styles.formActions}>
          <TouchableOpacity style={[shared.btnOutline, { flex: 1 }]} onPress={() => setShowForm(false)}>
            <Text style={shared.btnOutlineText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[shared.btnPrimary, { flex: 1 }]} onPress={handleSubmit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={shared.btnText}>{editing ? 'Update' : 'Add'}</Text>}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, margin: 12, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  item: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  itemText: { fontSize: 14, color: COLORS.text, marginBottom: 2 },
  itemLabel: { fontWeight: '600', color: COLORS.textMuted },
  itemDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  itemActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    backgroundColor: COLORS.primaryLight, borderRadius: 8,
    padding: 8, alignItems: 'center', justifyContent: 'center',
  },
  fabRow: {
    position: 'absolute', bottom: 24, right: 20,
    flexDirection: 'row', gap: 12, alignItems: 'center',
  },
  fab: {
    backgroundColor: COLORS.primary, width: 56, height: 56,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  fabScan: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  loadMore: { alignItems: 'center', paddingVertical: 12 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 16 },
});
