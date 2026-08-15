import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL, authHeaders } from '../utils/api';
import { COLORS, shared } from '../utils/theme';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];
const TABS = ['analytics', 'compare'];

const CAT_EMOJI = {
  grocery: '🛒', transport: '🚌', lunch: '🍔', garment: '👕',
  furniture: '🛋️', rent: '🏠', cosmetic: '✨', takeout: '📦',
  date: '❤️', other: '•••',
};

const toDate = (d) => d.toISOString().split('T')[0];
const toMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const fetchSummary = (period, dateParam, token) =>
  fetch(`${API_URL}/expenses/summary/${period}?date=${dateParam}`, { headers: authHeaders(token) }).then(r => r.json());

export default function DashboardScreen() {
  const { token } = useAuth();
  const today = new Date();

  const [tab, setTab] = useState('analytics');
  const [period, setPeriod] = useState('monthly');
  const [dateParam, setDateParam] = useState(toMonth(today) + '-01');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Compare
  const [cmpPeriod, setCmpPeriod] = useState('monthly');
  const [cmpA, setCmpA] = useState(toMonth(today) + '-01');
  const [cmpB, setCmpB] = useState(() => {
    const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [cmpData, setCmpData] = useState(null);
  const [cmpLoading, setCmpLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'analytics') return;
    setLoading(true);
    fetchSummary(period, dateParam, token).then(setData).finally(() => setLoading(false));
  }, [tab, period, dateParam]);

  useEffect(() => {
    if (tab !== 'compare') return;
    setCmpLoading(true);
    Promise.all([fetchSummary(cmpPeriod, cmpA, token), fetchSummary(cmpPeriod, cmpB, token)])
      .then(([a, b]) => setCmpData({ a, b }))
      .finally(() => setCmpLoading(false));
  }, [tab, cmpPeriod, cmpA, cmpB]);

  const getDefaultDateParam = (p) => {
    if (p === 'daily' || p === 'weekly') return toDate(today);
    if (p === 'monthly') return toMonth(today) + '-01';
    return `${today.getFullYear()}-01-01`;
  };

  const renderCompare = () => {
    if (cmpLoading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />;
    if (!cmpData) return null;
    const { a, b } = cmpData;
    const totalDiff = (a.grandTotal || 0) - (b.grandTotal || 0);
    const status = totalDiff < 0 ? 'saved' : totalDiff === 0 ? 'same' : 'over';
    const allCats = [...new Set([...(a.breakdown || []).map(x => x.category), ...(b.breakdown || []).map(x => x.category)])];

    return (
      <>
        <View style={styles.cmpBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cmpLabel}>Period A</Text>
            <Text style={styles.cmpValue}>R {Number(a.grandTotal || 0).toFixed(2)}</Text>
          </View>
          <Text style={styles.vs}>VS</Text>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.cmpLabel}>Period B</Text>
            <Text style={styles.cmpValue}>R {Number(b.grandTotal || 0).toFixed(2)}</Text>
          </View>
        </View>

        <View style={[styles.resultPill, { backgroundColor: status === 'saved' ? COLORS.successLight : status === 'over' ? COLORS.dangerLight : '#f3f4f6' }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: status === 'saved' ? COLORS.success : status === 'over' ? COLORS.danger : COLORS.textMuted }}>
            {status === 'saved' ? `✅ Saved R ${Math.abs(totalDiff).toFixed(2)}` : status === 'same' ? '➡️ No Change' : `⚠️ Overspent R ${Math.abs(totalDiff).toFixed(2)}`}
          </Text>
        </View>

        {allCats.map(cat => {
          const aItem = (a.breakdown || []).find(x => x.category === cat) || { total: 0 };
          const bItem = (b.breakdown || []).find(x => x.category === cat) || { total: 0 };
          if (!aItem.total && !bItem.total) return null;
          const diff = aItem.total - bItem.total;
          const s = diff < 0 ? 'saved' : diff === 0 ? 'same' : 'over';
          return (
            <View key={cat} style={[styles.cmpCard, { borderLeftColor: s === 'saved' ? COLORS.success : s === 'over' ? COLORS.danger : COLORS.border }]}>
              <Text style={styles.cmpCat}>{CAT_EMOJI[cat]} {cat}</Text>
              <View style={shared.spaceBetween}>
                <Text style={styles.cmpAmt}>A: R {aItem.total.toFixed(2)}</Text>
                <Text style={styles.cmpAmt}>B: R {bItem.total.toFixed(2)}</Text>
                <Text style={[styles.cmpDiff, { color: s === 'saved' ? COLORS.success : s === 'over' ? COLORS.danger : COLORS.textMuted }]}>
                  {diff > 0 ? '+' : ''}R {diff.toFixed(2)}
                </Text>
              </View>
            </View>
          );
        })}
      </>
    );
  };

  return (
    <ScrollView style={shared.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Main tabs */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'analytics' ? '📊 Analytics' : '⚖️ Compare'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period tabs */}
      <View style={styles.tabRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodTab, (tab === 'analytics' ? period : cmpPeriod) === p && styles.periodTabActive]}
            onPress={() => {
              if (tab === 'analytics') { setPeriod(p); setDateParam(getDefaultDateParam(p)); }
              else { setCmpPeriod(p); setCmpData(null); }
            }}
          >
            <Text style={[styles.periodText, (tab === 'analytics' ? period : cmpPeriod) === p && styles.periodTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date input */}
      {tab === 'analytics' && (
        <View style={{ marginBottom: 12 }}>
          <Text style={shared.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={shared.input}
            value={dateParam}
            onChangeText={setDateParam}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
      )}

      {tab === 'compare' && (
        <View style={styles.cmpPickers}>
          <View style={{ flex: 1 }}>
            <Text style={shared.label}>Period A</Text>
            <TextInput style={shared.input} value={cmpA} onChangeText={setCmpA} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} />
          </View>
          <Text style={styles.vs}>VS</Text>
          <View style={{ flex: 1 }}>
            <Text style={shared.label}>Period B</Text>
            <TextInput style={shared.input} value={cmpB} onChangeText={setCmpB} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} />
          </View>
        </View>
      )}

      {/* Analytics content */}
      {tab === 'analytics' && (
        loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} /> :
        data ? (
          <>
            <View style={styles.grandTotal}>
              <View>
                <Text style={styles.grandLabel}>{period.charAt(0).toUpperCase() + period.slice(1)} Total</Text>
                <Text style={styles.grandValue}>R {Number(data.grandTotal || 0).toFixed(2)}</Text>
              </View>
              <Text style={{ fontSize: 36 }}>💰</Text>
            </View>
            {(data.breakdown || []).filter(b => b.total > 0).sort((a, b) => b.total - a.total).map(b => (
              <View key={b.category} style={styles.summaryCard}>
                <Text style={styles.summaryEmoji}>{CAT_EMOJI[b.category] || '•'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>{b.category}</Text>
                  <Text style={styles.summaryCount}>{b.count} item{b.count !== 1 ? 's' : ''}</Text>
                </View>
                <Text style={styles.summaryValue}>R {Number(b.total).toFixed(2)}</Text>
              </View>
            ))}
            {(data.breakdown || []).every(b => b.total === 0) && (
              <Text style={shared.emptyText}>No expenses for this period.</Text>
            )}
          </>
        ) : null
      )}

      {tab === 'compare' && renderCompare()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: COLORS.white, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontWeight: '600', color: COLORS.textMuted, fontSize: 13 },
  tabTextActive: { color: '#fff' },
  periodTab: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: COLORS.white, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  periodTabActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  periodText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  periodTextActive: { color: COLORS.primary, fontWeight: '700' },
  grandTotal: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  grandLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  grandValue: { color: '#fff', fontSize: 28, fontWeight: '800' },
  summaryCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  summaryEmoji: { fontSize: 24, marginRight: 12 },
  summaryLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, textTransform: 'capitalize' },
  summaryCount: { fontSize: 12, color: COLORS.textMuted },
  summaryValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cmpBanner: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cmpLabel: { fontSize: 12, color: COLORS.textMuted },
  cmpValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  vs: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted, marginHorizontal: 8 },
  resultPill: { borderRadius: 10, padding: 14, marginBottom: 12, alignItems: 'center' },
  cmpCard: {
    backgroundColor: COLORS.white, borderRadius: 10, padding: 12,
    marginBottom: 8, borderLeftWidth: 4,
  },
  cmpCat: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, textTransform: 'capitalize' },
  cmpAmt: { fontSize: 13, color: COLORS.textMuted },
  cmpDiff: { fontSize: 13, fontWeight: '700' },
  cmpPickers: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
});
