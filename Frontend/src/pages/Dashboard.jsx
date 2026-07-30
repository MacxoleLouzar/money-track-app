import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/dashboard.css';

const periods = ['daily', 'weekly', 'monthly', 'yearly'];

const categoryEmoji = {
  grocery: '🛒', transport: '🚌', lunch: '🍔', garment: '👕',
  furniture: '🛋️', rent: '🏠', cosmetic: '✨', takeout: '📦',
  date: '❤️', other: '•••',
};

const toLocalDate = (d) => d.toISOString().split('T')[0];
const toMonthValue = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const toYearValue = (d) => String(d.getFullYear());

export default function Dashboard() {
  const { token } = useAuth();
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(toLocalDate(today));       // daily
  const [selectedMonth, setSelectedMonth] = useState(toMonthValue(today));    // monthly
  const [selectedYear, setSelectedYear] = useState(toYearValue(today));       // yearly
  // weekly uses selectedDate as the end date

  const getDateParam = () => {
    if (period === 'daily' || period === 'weekly') return selectedDate;
    if (period === 'monthly') return `${selectedMonth}-01`;
    if (period === 'yearly') return `${selectedYear}-01-01`;
  };

  useEffect(() => {
    setLoading(true);
    const dateParam = getDateParam();
    fetch(`/api/expenses/summary/${period}?date=${dateParam}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [period, selectedDate, selectedMonth, selectedYear]);

  const currentYear = today.getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track your spending over time</p>
        </div>
      </div>

      <div className="period-tabs">
        {periods.map(p => (
          <button key={p} className={`period-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="date-picker-row">
        {(period === 'daily') && (
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

      {loading ? (
        <div className="spinner" />
      ) : data ? (
        <>
          <div className="grand-total">
            <div>
              <div className="grand-total-label">{period.charAt(0).toUpperCase() + period.slice(1)} Total</div>
              <div className="grand-total-value">R {Number(data.grandTotal || 0).toFixed(2)}</div>
            </div>
            <div style={{ fontSize: '2.5rem' }}>💰</div>
          </div>

          <div className="summary-grid">
            {(data.breakdown || [])
              .filter(b => b.total > 0)
              .sort((a, b) => b.total - a.total)
              .map(b => (
                <div className="summary-card" key={b.category}>
                  <div className="summary-card-label">
                    {categoryEmoji[b.category] || '•'} {b.category}
                  </div>
                  <div className="summary-card-value">R {Number(b.total).toFixed(2)}</div>
                  <div className="summary-card-count">{b.count} item{b.count !== 1 ? 's' : ''}</div>
                </div>
              ))}
          </div>

          {(data.breakdown || []).every(b => b.total === 0) && (
            <div className="empty-state">
              <p>No expenses recorded for this period.</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
