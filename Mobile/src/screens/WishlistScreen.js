import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_URL, authHeaders } from '../utils/api';
import { COLORS, shared } from '../utils/theme';
import { ALL_CATEGORIES } from '../utils/categoryFields';
import BottomSheet from '../components/BottomSheet';
import FormField from '../components/FormField';

const PERIODS = ['daily', 'weekly', 'monthly'];

export default function WishlistScreen() {
  const { token } = useAuth();
  const WAPI = `${API_URL}/wishlist`;
  const headers = authHeaders(token);

  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const [showListForm, setShowListForm] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [listForm, setListForm] = useState({ name: '', period: 'weekly' });
  const [listSaving, setListSaving] = useState(false);
  const [listError, setListError] = useState('');

  const [showItemForm, setShowItemForm] = useState(false);
  const [activeListId, setActiveListId] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', category: 'grocery', note: '' });
  const [itemSaving, setItemSaving] = useState(false);

  const fetchLists = async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await fetch(WAPI, { headers });
    const data = await res.json();
    setLists(Array.isArray(data) ? data : []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchLists(); }, []);

  const toggleExpand = (id) => setExpanded(e => e === id ? null : id);

  const openCreate = () => { setEditingList(null); setListForm({ name: '', period: 'weekly' }); setListError(''); setShowListForm(true); };
  const openEdit = (l) => { setEditingList(l); setListForm({ name: l.name, period: l.period }); setListError(''); setShowListForm(true); };

  const handleListSubmit = async () => {
    if (!listForm.name.trim()) { setListError('Name is required.'); return; }
    setListSaving(true); setListError('');
    if (editingList) {
      const res = await fetch(`${WAPI}/${editingList._id}`, { method: 'PUT', headers, body: JSON.stringify(listForm) });
      const updated = await res.json();
      setLists(ls => ls.map(l => l._id === updated._id ? updated : l));
    } else {
      await fetch(WAPI, { method: 'POST', headers, body: JSON.stringify(listForm) });
      fetchLists(true);
    }
    setListSaving(false); setShowListForm(false);
  };

  const handleDeleteList = (id) => {
    Alert.alert('Delete', 'Delete this wishlist?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await fetch(`${WAPI}/${id}`, { method: 'DELETE', headers });
        setLists(ls => ls.filter(l => l._id !== id));
        if (expanded === id) setExpanded(null);
      }},
    ]);
  };

  const openAddItem = (listId) => { setActiveListId(listId); setItemForm({ name: '', category: 'grocery', note: '' }); setShowItemForm(true); };

  const handleItemSubmit = async () => {
    if (!itemForm.name.trim()) return;
    setItemSaving(true);
    const res = await fetch(`${WAPI}/${activeListId}/items`, { method: 'POST', headers, body: JSON.stringify(itemForm) });
    const updated = await res.json();
    setLists(ls => ls.map(l => l._id === updated._id ? updated : l));
    setItemSaving(false); setShowItemForm(false);
  };

  const handleRemoveItem = async (listId, itemId) => {
    const res = await fetch(`${WAPI}/${listId}/items/${itemId}`, { method: 'DELETE', headers });
    const updated = await res.json();
    setLists(ls => ls.map(l => l._id === updated._id ? updated : l));
  };

  const handleTick = async (listId, itemId, current) => {
    const res = await fetch(`${WAPI}/${listId}/items/${itemId}/tick`, { method: 'PATCH', headers, body: JSON.stringify({ bought: !current }) });
    const updated = await res.json();
    setLists(ls => ls.map(l => l._id === updated._id ? updated : l));
  };

  const renderList = ({ item: l }) => {
    const isOpen = expanded === l._id;
    const bought = l.items.filter(i => i.bought).length;
    const total = l.items.length;
    const pct = total > 0 ? Math.round((bought / total) * 100) : 0;

    return (
      <View style={styles.card}>
        <TouchableOpacity style={shared.spaceBetween} onPress={() => toggleExpand(l._id)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.listName}>{l.name}</Text>
            <Text style={styles.listMeta}>{l.period} · {bought}/{total} bought · {pct}%</Text>
          </View>
          <View style={shared.row}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openAddItem(l._id)}>
              <Ionicons name="add" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(l)}>
              <Ionicons name="pencil" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: COLORS.dangerLight }]} onPress={() => handleDeleteList(l._id)}>
              <Ionicons name="trash" size={16} color={COLORS.danger} />
            </TouchableOpacity>
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>

        {/* Progress bar */}
        {total > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct === 100 ? COLORS.success : COLORS.primary }]} />
          </View>
        )}

        {isOpen && (
          <View style={styles.itemsContainer}>
            {l.items.length === 0 ? (
              <Text style={{ color: COLORS.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 8 }}>No items yet. Tap + to add.</Text>
            ) : (
              l.items.map(item => (
                <View key={item._id} style={[styles.wlItem, item.bought && styles.wlItemBought]}>
                  <TouchableOpacity onPress={() => handleTick(l._id, item._id, item.bought)}>
                    <Ionicons
                      name={item.bought ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={item.bought ? COLORS.success : COLORS.border}
                    />
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.itemName, item.bought && styles.itemNameBought]}>{item.name}</Text>
                    <Text style={styles.itemCat}>{ALL_CATEGORIES.find(c => c.key === item.category)?.emoji} {item.category}</Text>
                    {item.note ? <Text style={styles.itemNote}>{item.note}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveItem(l._id, item._id)}>
                    <Ionicons name="close" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity style={[shared.btnOutline, { marginTop: 8 }]} onPress={() => openAddItem(l._id)}>
              <Ionicons name="add" size={16} color={COLORS.text} />
              <Text style={shared.btnOutlineText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={shared.container}>
      <FlatList
        data={lists}
        keyExtractor={i => i._id}
        renderItem={renderList}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLists(); }} />}
        ListEmptyComponent={!loading && <Text style={shared.emptyText}>No wishlists yet. Tap + to create one.</Text>}
      />
      {loading && <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} size="large" />}

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* List form */}
      <BottomSheet visible={showListForm} title={editingList ? 'Edit List' : 'New Wishlist'} onClose={() => setShowListForm(false)}>
        <View style={{ marginBottom: 12 }}>
          <Text style={shared.label}>List Name</Text>
          <TextInput style={shared.input} placeholder="e.g. Weekly Groceries" placeholderTextColor={COLORS.textMuted}
            value={listForm.name} onChangeText={v => setListForm(f => ({ ...f, name: v }))} />
        </View>
        <FormField
          field={{ name: 'period', label: 'Period', type: 'select', options: PERIODS }}
          value={listForm.period}
          onChange={v => setListForm(f => ({ ...f, period: v }))}
        />
        {listError ? <Text style={shared.errorText}>{listError}</Text> : null}
        <View style={styles.formActions}>
          <TouchableOpacity style={[shared.btnOutline, { flex: 1 }]} onPress={() => setShowListForm(false)}>
            <Text style={shared.btnOutlineText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[shared.btnPrimary, { flex: 1 }]} onPress={handleListSubmit} disabled={listSaving}>
            {listSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={shared.btnText}>{editingList ? 'Update' : 'Create'}</Text>}
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Add item form */}
      <BottomSheet visible={showItemForm} title="Add Item" onClose={() => setShowItemForm(false)}>
        <View style={{ marginBottom: 12 }}>
          <Text style={shared.label}>Item Name</Text>
          <TextInput style={shared.input} placeholder="e.g. Milk" placeholderTextColor={COLORS.textMuted}
            value={itemForm.name} onChangeText={v => setItemForm(f => ({ ...f, name: v }))} />
        </View>
        <FormField
          field={{ name: 'category', label: 'Category', type: 'select', options: ALL_CATEGORIES.map(c => c.key) }}
          value={itemForm.category}
          onChange={v => setItemForm(f => ({ ...f, category: v }))}
        />
        <View style={{ marginBottom: 12 }}>
          <Text style={shared.label}>Note (optional)</Text>
          <TextInput style={shared.input} placeholder="e.g. 2L full cream" placeholderTextColor={COLORS.textMuted}
            value={itemForm.note} onChangeText={v => setItemForm(f => ({ ...f, note: v }))} />
        </View>
        <View style={styles.formActions}>
          <TouchableOpacity style={[shared.btnOutline, { flex: 1 }]} onPress={() => setShowItemForm(false)}>
            <Text style={shared.btnOutlineText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[shared.btnPrimary, { flex: 1 }]} onPress={handleItemSubmit} disabled={itemSaving}>
            {itemSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={shared.btnText}>Add Item</Text>}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  listName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  listMeta: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  iconBtn: { backgroundColor: COLORS.primaryLight, borderRadius: 8, padding: 7, marginLeft: 6 },
  progressTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', borderRadius: 3 },
  itemsContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  wlItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  wlItemBought: { opacity: 0.6 },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  itemNameBought: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  itemCat: { fontSize: 12, color: COLORS.textMuted, textTransform: 'capitalize' },
  itemNote: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    backgroundColor: COLORS.primary, width: 56, height: 56,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 16 },
});
