import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/dashboard.css';
import { API_URL } from '../utils/api';

const periods = ['daily', 'weekly', 'monthly', 'yearly'];

const categoryEmoji = {
  grocery: '🛒', transport: '🚌', lunch: '🍔', garment: '👕',
  furniture: '🛋️', rent: '🏠', cosmetic: '✨', takeout: '📦',
  date: '❤️', other: '•••',
};

const toLocalDate = (d) => d.toISOString().split('T')[0];
const toMonthValue = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const toYearValue = (d) => String(d.getFullYear());

/** Returns the previous period's date param given a period type and current date param */
const getPrevDateParam = (period, dateParam) => {
  if (period === 'daily') {
    const d = new Date(dateParam);
    d.setDate(d.getDate() - 1);
    return toLocalDate(d);
  }
  if (period === 'weekly') {
    const d = new Date(dateParam);
    d.setDate(d.getDate() - 7);
    return toLocalDate(d);
  }
  if (period === 'monthly') {
    const [y, m] = dateParam.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
  if (period === 'yearly') {
    const y = parseInt(dateParam);
    return `${y - 1}-01-01`;
  }
};

/** Human-readable label for a period + date param */
const periodLabel = (period, dateParam) => {
  if (period === 'daily') return new Date(dateParam).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  if (period === 'weekly') {
    const end = new Date(dateParam);
    const start = new Date(dateParam); start.setDate(start.getDate() - 6);
    return `${toLocalDate(start)} → ${toLocalDate(end)}`;
  }
  if (period === 'monthly') return new Date(dateParam).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  if (period === 'yearly') return dateParam.split('-')[0];
};

const fetchSummary = (period, dateParam, token) =>
  fetch(`${API_URL}/expenses/summary/${period}?date=${dateParam}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());

export default function Dashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState('analytics'); // 'analytics' | 'compare'
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(toLocalDate(today));
  const [selectedMonth, setSelectedMonth] = useState(toMonthValue(today));
  const [selectedYear, setSelectedYear] = useState(toYearValue(today));

  // Compare state — period A and B
  const [cmpPeriod, setCmpPeriod] = useState('monthly');
  const [cmpA, setCmpA] = useState(toMonthValue(today) + '-01');
  const [cmpB, setCmpB] = useState(() => {
    const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [cmpData, setCmpData] = useState(null);
  const [cmpLoading, setCmpLoading] = useState(false);

  const getDateParam = () => {
    if (period === 'daily' || period === 'weekly') return selectedDate;
    if (period === 'monthly') return `${selectedMonth}-01`;
    if (period === 'yearly') return `${selectedYear}-01-01`;
  };

  // Analytics fetch
  useEffect(() => {
    if (tab !== 'analytics') return;
    setLoading(true);
    fetchSummary(period, getDateParam(), token)
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [tab, period, selectedDate, selectedMonth, selectedYear]);

  // Compare fetch
  useEffect(() => {
    if (tab !== 'compare' || !cmpA || !cmpB) return;
    setCmpLoading(true);
    Promise.all([
      fetchSummary(cmpPeriod, cmpA, token),
      fetchSummary(cmpPeriod, cmpB, token),
    ]).then(([a, b]) => setCmpData({ a, b }))
      .finally(() => setCmpLoading(false));
  }, [tab, cmpPeriod, cmpA, cmpB]);

  const currentYear = today.getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Build compare date input for a given side
  const renderCmpPicker = (label, value, onChange) => {
    if (cmpPeriod === 'daily' || cmpPeriod === 'weekly') {
      return (
        <div className="date-picker-group">
          <label>{label}</label>
          <input type="date" value={value} max={toLocalDate(today)}
            onChange={e => onChange(e.target.value)} className="form-input date-input" />
        </div>
      );
    }
    if (cmpPeriod === 'monthly') {
      return (
        <div className="date-picker-group">
          <label>{label}</label>
          <input type="month" value={value.slice(0, 7)} max={toMonthValue(today)}
            onChange={e => onChange(e.target.value + '-01')} className="form-input date-input" />
        </div>
      );
    }
    if (cmpPeriod === 'yearly') {
      return (
        <div className="date-picker-group">
          <label>{label}</label>
          <select value={value.slice(0, 4)} onChange={e => onChange(e.target.value + '-01-01')} className="form-select date-input">
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      );
    }
  };

  const renderCompare = () => {
    if (cmpLoading) return <div className="spinner" />;
    if (!cmpData) return null;

    const { a, b } = cmpData;
    const labelA = periodLabel(cmpPeriod, cmpA);
    const labelB = periodLabel(cmpPeriod, cmpB);

    const allCats = [...new Set([
      ...(a.breakdown || []).map(x => x.category),
      ...(b.breakdown || []).map(x => x.category),
    ])];

    const rows = allCats.map(cat => {
      const aItem = (a.breakdown || []).find(x => x.category === cat) || { total: 0 };
      const bItem = (b.breakdown || []).find(x => x.category === cat) || { total: 0 };
      const diff = aItem.total - bItem.total;
      const pct = bItem.total > 0 ? (diff / bItem.total) * 100 : (aItem.total > 0 ? 100 : 0);
      return { cat, aTotal: aItem.total, bTotal: bItem.total, diff, pct,
        status: diff < 0 ? 'saved' : diff === 0 ? 'same' : 'over' };
    }).filter(r => r.aTotal > 0 || r.bTotal > 0)
      .sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));

    const totalDiff = (a.grandTotal || 0) - (b.grandTotal || 0);
    const totalPct = (b.grandTotal || 0) > 0 ? (totalDiff / b.grandTotal) * 100 : 0;
    const totalStatus = totalDiff < 0 ? 'saved' : totalDiff === 0 ? 'same' : 'over';

    return (
      <>
        {/* Grand total banner */}
        <div className="cmp-banner">
          <div className="cmp-banner-side">
            <div className="cmp-banner-label">Period A · {labelA}</div>
            <div className="cmp-banner-value">R {Number(a.grandTotal || 0).toFixed(2)}</div>
          </div>
          <div className="cmp-banner-vs">VS</div>
          <div className="cmp-banner-side cmp-banner-side-b">
            <div className="cmp-banner-label">Period B · {labelB}</div>
            <div className="cmp-banner-value">R {Number(b.grandTotal || 0).toFixed(2)}</div>
          </div>
        </div>

        {/* Overall result pill */}
        <div className={`cmp-result ${totalStatus}`}>
          <span className="cmp-result-icon">
            {totalStatus === 'saved' ? '✅' : totalStatus === 'same' ? '➡️' : '⚠️'}
          </span>
          <div>
            <div className="cmp-result-title">
              {totalStatus === 'saved' ? 'You Saved' : totalStatus === 'same' ? 'No Change' : 'Overspent'}
            </div>
            <div className="cmp-result-sub">
              {totalStatus === 'same'
                ? 'Spending is identical across both periods'
                : `R ${Math.abs(totalDiff).toFixed(2)} · ${Math.abs(totalPct).toFixed(1)}% ${totalStatus === 'saved' ? 'less' : 'more'} than Period B`}
            </div>
          </div>
        </div>

        {/* Category cards */}
        {rows.length === 0
          ? <div className="empty-state"><p>No expenses in either period to compare.</p></div>
          : <div className="cmp-cards">
              {rows.map(({ cat, aTotal, bTotal, diff, pct, status }) => (
                <div key={cat} className={`cmp-card cmp-card-${status}`}>
                  <div className="cmp-card-header">
                    <span className="cmp-card-cat">{categoryEmoji[cat]} {cat}</span>
                    <span className={`cmp-badge cmp-badge-${status}`}>
                      {status === 'saved' ? '✅ Saved' : status === 'same' ? '➡️ Same' : '⚠️ Over'}
                    </span>
                  </div>
                  <div className="cmp-card-amounts">
                    <div className="cmp-card-amt">
                      <div className="cmp-card-amt-label">A · {labelA}</div>
                      <div className="cmp-card-amt-value">R {aTotal.toFixed(2)}</div>
                    </div>
                    <div className="cmp-card-divider">→</div>
                    <div className="cmp-card-amt">
                      <div className="cmp-card-amt-label">B · {labelB}</div>
                      <div className="cmp-card-amt-value">R {bTotal.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="cmp-card-footer">
                    <span className={`cmp-diff ${status === 'saved' ? 'cmp-green' : status === 'over' ? 'cmp-red' : ''}`}>
                      {diff > 0 ? '+' : ''}R {diff.toFixed(2)}
                    </span>
                    <span className={`cmp-pct ${status === 'saved' ? 'cmp-green' : status === 'over' ? 'cmp-red' : ''}`}>
                      {diff > 0 ? '+' : ''}{pct.toFixed(1)}%
                    </span>
                  </div>
                  {/* Visual bar showing A vs B */}
                  {(aTotal > 0 || bTotal > 0) && (() => {
                    const max = Math.max(aTotal, bTotal);
                    return (
                      <div className="cmp-bar-row">
                        <div className="cmp-bar-track">
                          <div className="cmp-bar-a" style={{ width: `${(aTotal / max) * 100}%` }} />
                        </div>
                        <div className="cmp-bar-track">
                          <div className="cmp-bar-b" style={{ width: `${(bTotal / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
        }
      </>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track and compare your spending</p>
        </div>
      </div>

      {/* Main tabs */}
      <div className="period-tabs" style={{ marginBottom: '1rem' }}>
        <button className={`period-tab ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>
          📊 Analytics
        </button>
        <button className={`period-tab ${tab === 'compare' ? 'active' : ''}`} onClick={() => setTab('compare')}>
          ⚖️ Compare
        </button>
      </div>

      {/* ── ANALYTICS TAB ── */}
      {tab === 'analytics' && (
        <>
          <div className="period-tabs">
            {periods.map(p => (
              <button key={p} className={`period-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="date-picker-row">
            {period === 'daily' && (
              <div className="date-picker-group">
                <label>Select Day</label>
                <input type="date" value={selectedDate} max={toLocalDate(today)}
                  onChange={e => setSelectedDate(e.target.value)} className="form-input date-input" />
              </div>
            )}
            {period === 'weekly' && (
              <div className="date-picker-group">
                <label>Week ending on</label>
                <input type="date" value={selectedDate} max={toLocalDate(today)}
                  onChange={e => setSelectedDate(e.target.value)} className="form-input date-input" />
              </div>
            )}
            {period === 'monthly' && (
              <div className="date-picker-group">
                <label>Select Month</label>
                <input type="month" value={selectedMonth} max={toMonthValue(today)}
                  onChange={e => setSelectedMonth(e.target.value)} className="form-input date-input" />
              </div>
            )}
            {period === 'yearly' && (
              <div className="date-picker-group">
                <label>Select Year</label>
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="form-select date-input">
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
          </div>

          {loading ? <div className="spinner" /> : data ? (
            <>
              <div className="grand-total">
                <div>
                  <div className="grand-total-label">{period.charAt(0).toUpperCase() + period.slice(1)} Total</div>
                  <div className="grand-total-value">R {Number(data.grandTotal || 0).toFixed(2)}</div>
                </div>
                <div style={{ fontSize: '2.5rem' }}>💰</div>
              </div>
              <div className="summary-grid">
                {(data.breakdown || []).filter(b => b.total > 0).sort((a, b) => b.total - a.total).map(b => (
                  <div className="summary-card" key={b.category}>
                    <div className="summary-card-label">{categoryEmoji[b.category] || '•'} {b.category}</div>
                    <div className="summary-card-value">R {Number(b.total).toFixed(2)}</div>
                    <div className="summary-card-count">{b.count} item{b.count !== 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
              {(data.breakdown || []).every(b => b.total === 0) && (
                <div className="empty-state"><p>No expenses recorded for this period.</p></div>
              )}
            </>
          ) : null}
        </>
      )}

      {/* ── COMPARE TAB ── */}
      {tab === 'compare' && (
        <>
          <div className="period-tabs">
            {periods.map(p => (
              <button key={p} className={`period-tab ${cmpPeriod === p ? 'active' : ''}`}
                onClick={() => {
                  setCmpPeriod(p);
                  setCmpData(null);
                  const now = new Date();
                  if (p === 'daily') {
                    const prev = new Date(); prev.setDate(prev.getDate() - 1);
                    setCmpA(toLocalDate(now)); setCmpB(toLocalDate(prev));
                  } else if (p === 'weekly') {
                    const prev = new Date(); prev.setDate(prev.getDate() - 7);
                    setCmpA(toLocalDate(now)); setCmpB(toLocalDate(prev));
                  } else if (p === 'monthly') {
                    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    setCmpA(toMonthValue(now) + '-01');
                    setCmpB(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-01`);
                  } else {
                    setCmpA(`${now.getFullYear()}-01-01`);
                    setCmpB(`${now.getFullYear() - 1}-01-01`);
                  }
                }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="cmp-pickers">
            {renderCmpPicker('Period A', cmpA, setCmpA)}
            <div className="cmp-vs-divider">VS</div>
            {renderCmpPicker('Period B', cmpB, setCmpB)}
          </div>

          {renderCompare()}
        </>
      )}
    </div>
  );
}
