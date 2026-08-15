import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_URL, authHeaders } from '../utils/api';
import { COLORS, shared } from '../utils/theme';
import { ALL_CATEGORIES, CATEGORY_FIELDS } from '../utils/categoryFields';
import BottomSheet from '../components/BottomSheet';
import FormField from '../components/FormField';

const PERIODS = ['daily', 'weekly', 'monthly'];

const alertConfig = (alert) => {
  if (alert === 'overdraft') return { color: COLORS.purple, bg: COLORS.purpleLight, label: "🚨 Overdraft! You've exceeded your budget." };
  if (alert === 'limit')     return { color: COLORS.danger, bg: COLORS.dangerLight, label: '🔴 Budget limit reached (100%)!' };
  if (alert === '75')        return { color: COLORS.warning, bg: COLORS.warningLight, label: '🟠 Warning: 75% of budget used.' };
  if (alert === '50')        return { color: COLORS.primary, bg: COLORS.primaryLight, label: '🔵 Heads up: 50% of budget used.' };
  return null;
};

const barColor = (pct) => {
  if (pct >= 100) return COLORS.purple;
  if (pct >= 75)  return COLORS.warning;
  if (pct >= 50)  return COLORS.primary;
  return COLORS.success;
};

export default function BudgetScreen() {
  const { token } = useAuth();
  const BAPI = `${API_URL}/budget`;
  const headers = authHeaders(token);

  const [budgets, setBudgets] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ name: '', amount: '', period: 'monthly', categories: [] });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [showExpForm, setShowExpForm] = useState(false);
  const [activeBudgetId, setActiveBudgetId] = useState(null);
  const [expCategory, setExpCategory] = useState('grocery');
  const [expForm, setExpForm] = useState({});
  const [expSaving, setExpSaving] = useState(false);

  const fetchBudgets = async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await fetch(BAPI, { headers });
    const data = await res.json();
    setBudgets(Array.isArray(data) ? data : []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchBudgets(); }, []);

  const fetchStatus = async (id) => {
    const res = await fetch(`${BAPI}/${id}/status`, { headers });
    const data = await res.json();
    setStatuses(s => ({ ...s, [id]: data }));
  };

  const toggleExpand = (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!statuses[id]) fetchStatus(id);
  };

  const toggleCategory = (key) => {
    setBudgetForm(f => ({
      ...f,
      categories: f.categories.includes(key) ? f.categories.filter(c => c !== key) : [...f.categories, key],
    }));
  };

  const openCreate = () => { setEditingBudget(null); setBudgetForm({ name: '', amount: '', period: 'monthly', categories: [] }); setFormError(''); setShowForm(true); };
  const openEdit = (b) => { setEditingBudget(b); setBudgetForm({ name: b.name, amount: String(b.amount), period: b.period, categories: b.categories || [] }); setFormError(''); setShowForm(true); };

  const handleSubmit = async () => {
    if (!budgetForm.name.trim()) { setFormError('Budget name is required.'); return; }
    if (!budgetForm.amount || Number(budgetForm.amount) <= 0) { setFormError('Enter a valid amount.'); return; }
    setSaving(true); setFormError('');
    const body = JSON.stringify({ ...budgetForm, amount: Number(budgetForm.amount) });
    if (editingBudget) {
      await fetch(`${BAPI}/${editingBudget._id}`, { method: 'PUT', headers, body });
      setStatuses(s => { const n = { ...s }; delete n[editingBudget._id]; return n; });
    } else {
      await fetch(BAPI, { method: 'POST', headers, body });
    }
    setSaving(false); setShowForm(false);
    fetchBudgets(true);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this budget?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await fetch(`${BAPI}/${id}`, { method: 'DELETE', headers });
        setBudgets(b => b.filter(x => x._id !== id));
        if (expanded === id) setExpanded(null);
      }},
    ]);
  };

  const openAddExpense = (budgetId, budgetCategories) => {
    const cats = budgetCategories.length > 0 ? budgetCategories : ALL_CATEGORIES.map(c => c.key);
    setActiveBudgetId(budgetId);
    setExpCategory(cats[0]);
    setExpForm({});
    setShowExpForm(true);
  };

  const handleExpSubmit = async () => {
    setExpSaving(true);
    await fetch(`${API_URL}/expenses/${expCategory}`, { method: 'POST', headers, body: JSON.stringify(expForm) });
    setExpSaving(false);
    setShowExpForm(false);
    fetchStatus(activeBudgetId);
  };

  const activeBudget = budgets.find(b => b._id === activeBudgetId);
  const expCats = activeBudget ? (activeBudget.categories.length > 0 ? activeBudget.categories : ALL_CATEGORIES.map(c => c.key)) : [];
  const expFields = (CATEGORY_FIELDS[expCategory] || []).filter(f => f.type !== 'file');

  const renderBudget = ({ item: b }) => {
    const st = statuses[b._id];
    const isOpen = expanded === b._id;
    const cfg = st ? alertConfig(st.alert) : null;

    return (
      <View style={styles.card}>
        <TouchableOpacity style={shared.spaceBetween} onPress={() => toggleExpand(b._id)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.budgetName}>{b.name}</Text>
            <Text style={styles.budgetMeta}>R {Number(b.amount).toFixed(2)} · {b.period}</Text>
          </View>
          <View style={shared.row}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openAddExpense(b._id, b.categories)}>
              <Ionicons name="bag-add" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(b)}>
              <Ionicons name="pencil" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: COLORS.dangerLight }]} onPress={() => handleDelete(b._id)}>
              <Ionicons name="trash" size={16} color={COLORS.danger} />
            </TouchableOpacity>
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.expanded}>
            {!st ? <ActivityIndicator color={COLORS.primary} /> : (
              <>
                {cfg && <View style={[styles.alert, { backgroundColor: cfg.bg }]}><Text style={{ color: cfg.color, fontWeight: '600' }}>{cfg.label}</Text></View>}

                <View style={styles.statsRow}>
                  {[
                    { label: 'Budget', value: `R ${Number(st.budget).toFixed(2)}`, sub: st.period },
                    { label: 'Spent', value: `R ${Number(st.spent).toFixed(2)}`, sub: `${st.percentage}% used`, valueColor: st.percentage >= 100 ? COLORS.danger : COLORS.text },
                    { label: st.remaining >= 0 ? 'Remaining' : 'Overdraft', value: `R ${Math.abs(st.remaining).toFixed(2)}`, sub: st.remaining >= 0 ? 'left' : 'over', valueColor: st.remaining >= 0 ? COLORS.success : COLORS.purple },
                  ].map(s => (
                    <View key={s.label} style={styles.statCard}>
                      <Text style={styles.statLabel}>{s.label}</Text>
                      <Text style={[styles.statValue, s.valueColor && { color: s.valueColor }]}>{s.value}</Text>
                      <Text style={styles.statSub}>{s.sub}</Text>
                    </View>
                  ))}
                </View>

                {/* Progress bar */}
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.min(st.percentage, 100)}%`, backgroundColor: barColor(st.percentage) }]} />
                </View>

                {/* Category breakdown */}
                {st.breakdown?.filter(r => r.total > 0).length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.sectionTitle}>Category Breakdown</Text>
                    {st.breakdown.filter(r => r.total > 0).sort((a, b) => b.total - a.total).map(r => (
                      <View key={r.category} style={shared.spaceBetween}>
                        <Text style={styles.breakdownCat}>{ALL_CATEGORIES.find(c => c.key === r.category)?.emoji} {r.category}</Text>
                        <Text style={styles.breakdownVal}>R {Number(r.total).toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity style={[shared.btnPrimary, { marginTop: 12 }]} onPress={() => openAddExpense(b._id, b.categories)}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={shared.btnText}>Add Expense</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={shared.container}>
      <FlatList
        data={budgets}
        keyExtractor={i => i._id}
        renderItem={renderBudget}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBudgets(); }} />}
        ListEmptyComponent={!loading && <Text style={shared.emptyText}>No budgets yet. Tap + to create one.</Text>}
      />
      {loading && <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} size="large" />}

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Budget form */}
      <BottomSheet visible={showForm} title={editingBudget ? 'Edit Budget' : 'New Budget'} onClose={() => setShowForm(false)}>
        <View style={{ marginBottom: 12 }}>
          <Text style={shared.label}>Budget Name</Text>
          <TextInput style={shared.input} placeholder="e.g. Monthly Groceries" placeholderTextColor={COLORS.textMuted}
            value={budgetForm.name} onChangeText={v => setBudgetForm(f => ({ ...f, name: v }))} />
        </View>
        <View style={{ marginBottom: 12 }}>
          <Text style={shared.label}>Amount (R)</Text>
          <TextInput style={shared.input} placeholder="e.g. 3000" placeholderTextColor={COLORS.textMuted}
            keyboardType="decimal-pad" value={budgetForm.amount} onChangeText={v => setBudgetForm(f => ({ ...f, amount: v }))} />
        </View>
        <FormField
          field={{ name: 'period', label: 'Period', type: 'select', options: PERIODS }}
          value={budgetForm.period}
          onChange={v => setBudgetForm(f => ({ ...f, period: v }))}
        />
        <Text style={shared.label}>Categories <Text style={{ color: COLORS.textMuted, fontWeight: '400' }}>(leave empty = all)</Text></Text>
        <View style={styles.catGrid}>
          {ALL_CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[styles.catChip, budgetForm.categories.includes(c.key) && styles.catChipActive]}
              onPress={() => toggleCategory(c.key)}
            >
              <Text style={[styles.catChipText, budgetForm.categories.includes(c.key) && styles.catChipTextActive]}>
                {c.emoji} {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {formError ? <Text style={shared.errorText}>{formError}</Text> : null}
        <View style={styles.formActions}>
          <TouchableOpacity style={[shared.btnOutline, { flex: 1 }]} onPress={() => setShowForm(false)}>
            <Text style={shared.btnOutlineText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[shared.btnPrimary, { flex: 1 }]} onPress={handleSubmit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={shared.btnText}>{editingBudget ? 'Update' : 'Create'}</Text>}
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Add expense to budget */}
      <BottomSheet visible={showExpForm} title={`Add Expense — ${activeBudget?.name || ''}`} onClose={() => setShowExpForm(false)}>
        <FormField
          field={{ name: 'category', label: 'Category', type: 'select', options: expCats }}
          value={expCategory}
          onChange={v => { setExpCategory(v); setExpForm({}); }}
        />
        {expFields.map(f => (
          <FormField key={f.name} field={f} value={expForm[f.name]} onChange={v => setExpForm(prev => ({ ...prev, [f.name]: v }))} />
        ))}
        <View style={styles.formActions}>
          <TouchableOpacity style={[shared.btnOutline, { flex: 1 }]} onPress={() => setShowExpForm(false)}>
            <Text style={shared.btnOutlineText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[shared.btnPrimary, { flex: 1 }]} onPress={handleExpSubmit} disabled={expSaving}>
            {expSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={shared.btnText}>Add & Track</Text>}
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
  budgetName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  budgetMeta: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  iconBtn: { backgroundColor: COLORS.primaryLight, borderRadius: 8, padding: 7, marginLeft: 6 },
  expanded: { marginTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14 },
  alert: { borderRadius: 8, padding: 10, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: COLORS.bg, borderRadius: 10, padding: 10, alignItems: 'center' },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  statSub: { fontSize: 11, color: COLORS.textMuted },
  barTrack: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  barFill: { height: '100%', borderRadius: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  breakdownCat: { fontSize: 13, color: COLORS.text, textTransform: 'capitalize', paddingVertical: 3 },
  breakdownVal: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    backgroundColor: COLORS.primary, width: 56, height: 56,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 13, color: COLORS.text },
  catChipTextActive: { color: '#fff', fontWeight: '600' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 16 },
});
