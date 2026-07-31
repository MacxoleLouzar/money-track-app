import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil, X, ShoppingBag, Search } from 'lucide-react';
import { CATEGORY_FIELDS } from '../utils/categoryFields';
import { API_URL } from '../utils/api';
import '../css/dashboard.css';
import '../css/budget.css';

const PERIODS = ['daily', 'weekly', 'monthly'];
const ALL_CATEGORIES = [
  { key: 'grocery',   label: '🛒 Groceries' },
  { key: 'transport', label: '🚌 Transport' },
  { key: 'lunch',     label: '🍔 Lunch' },
  { key: 'garment',   label: '👕 Garments' },
  { key: 'furniture', label: '🛋️ Furniture' },
  { key: 'rent',      label: '🏠 Rent' },
  { key: 'cosmetic',  label: '✨ Cosmetics' },
  { key: 'takeout',   label: '📦 Takeouts' },
  { key: 'date',      label: '❤️ Dates' },
  { key: 'other',     label: '••• Other' },
];

const EMPTY_BUDGET_FORM = { name: '', amount: '', period: 'monthly', categories: [] };

const alertConfig = (alert) => {
  if (alert === 'overdraft') return { color: '#7c3aed', bg: '#ede9fe', label: "🚨 Overdraft! You've exceeded your budget." };
  if (alert === 'limit')     return { color: '#dc2626', bg: '#fee2e2', label: '🔴 Budget limit reached (100%)!' };
  if (alert === '75')        return { color: '#d97706', bg: '#fef3c7', label: '🟠 Warning: 75% of budget used.' };
  if (alert === '50')        return { color: '#2563eb', bg: '#dbeafe', label: '🔵 Heads up: 50% of budget used.' };
  return null;
};

const barColor = (pct) => {
  if (pct >= 100) return '#7c3aed';
  if (pct >= 75)  return '#d97706';
  if (pct >= 50)  return '#2563eb';
  return '#16a34a';
};

export default function Budget() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const BAPI = `${API_URL}/budget`;

  const [budgets, setBudgets]     = useState([]);
  const [statuses, setStatuses]   = useState({});
  const [expanded, setExpanded]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [budgetSearch, setBudgetSearch] = useState('');
  const [budgetPeriodFilter, setBudgetPeriodFilter] = useState('');

  // Budget create/edit modal
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudget, setEditingBudget]   = useState(null);
  const [budgetForm, setBudgetForm]         = useState(EMPTY_BUDGET_FORM);
  const [budgetSaving, setBudgetSaving]     = useState(false);
  const [budgetError, setBudgetError]       = useState('');

  // Expense add modal (inside a budget)
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [activeBudgetId, setActiveBudgetId]     = useState(null);
  const [expCategory, setExpCategory]           = useState('');
  const [expForm, setExpForm]                   = useState({});
  const [expSaving, setExpSaving]               = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    const res = await fetch(BAPI, { headers });
    const data = await res.json();
    setBudgets(Array.isArray(data) ? data : []);
    setLoading(false);
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

  // ── Budget form ──────────────────────────────────────
  const toggleCategory = (key) => {
    setBudgetForm(f => ({
      ...f,
      categories: f.categories.includes(key)
        ? f.categories.filter(c => c !== key)
        : [...f.categories, key],
    }));
  };

  const openCreateBudget = () => { setEditingBudget(null); setBudgetForm(EMPTY_BUDGET_FORM); setBudgetError(''); setShowBudgetForm(true); };
  const openEditBudget = (b) => {
    setEditingBudget(b);
    setBudgetForm({ name: b.name, amount: b.amount, period: b.period, categories: b.categories || [] });
    setBudgetError('');
    setShowBudgetForm(true);
  };

  const handleBudgetSubmit = async e => {
    e.preventDefault();
    if (!budgetForm.name.trim()) { setBudgetError('Budget name is required.'); return; }
    if (!budgetForm.amount || Number(budgetForm.amount) <= 0) { setBudgetError('Enter a valid amount.'); return; }
    setBudgetSaving(true); setBudgetError('');
    const body = JSON.stringify({ ...budgetForm, amount: Number(budgetForm.amount) });
    if (editingBudget) {
      await fetch(`${BAPI}/${editingBudget._id}`, { method: 'PUT', headers, body });
      setStatuses(s => { const n = { ...s }; delete n[editingBudget._id]; return n; });
    } else {
      await fetch(BAPI, { method: 'POST', headers, body });
    }
    setBudgetSaving(false);
    setShowBudgetForm(false);
    fetchBudgets();
  };

  const handleDeleteBudget = async (id) => {
    if (!confirm('Delete this budget?')) return;
    await fetch(`${BAPI}/${id}`, { method: 'DELETE', headers });
    setBudgets(b => b.filter(x => x._id !== id));
    if (expanded === id) setExpanded(null);
  };

  // ── Expense form ─────────────────────────────────────
  const openAddExpense = (budgetId, budgetCategories) => {
    const cats = budgetCategories.length > 0 ? budgetCategories : ALL_CATEGORIES.map(c => c.key);
    setActiveBudgetId(budgetId);
    setExpCategory(cats[0]);
    setExpForm({});
    setShowExpenseModal(true);
  };

  const handleExpChange = e => setExpForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleExpSubmit = async e => {
    e.preventDefault();
    setExpSaving(true);
    await fetch(`${API_URL}/expenses/${expCategory}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(expForm),
    });
    setExpSaving(false);
    setShowExpenseModal(false);
    // Refresh this budget's status
    fetchStatus(activeBudgetId);
  };

  const activeBudget = budgets.find(b => b._id === activeBudgetId);
  const expCats = activeBudget
    ? (activeBudget.categories.length > 0 ? activeBudget.categories : ALL_CATEGORIES.map(c => c.key))
    : [];
  const expFields = (CATEGORY_FIELDS[expCategory] || []).filter(f => f.type !== 'file');

  const filteredBudgets = budgets.filter(b => {
    const matchName = !budgetSearch || b.name.toLowerCase().includes(budgetSearch.toLowerCase());
    const matchPeriod = !budgetPeriodFilter || b.period === budgetPeriodFilter;
    return matchName && matchPeriod;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Budgets</h1>
          <p className="page-subtitle">{budgets.length} budget{budgets.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateBudget}>
          <Plus size={16} /> New Budget
        </button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <Search size={15} className="filter-search-icon" />
          <input className="filter-input" placeholder="Search budgets..." value={budgetSearch}
            onChange={e => setBudgetSearch(e.target.value)} />
        </div>
        <select className="filter-input" style={{ width: 'auto' }} value={budgetPeriodFilter}
          onChange={e => setBudgetPeriodFilter(e.target.value)}>
          <option value="">All periods</option>
          {PERIODS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        {(budgetSearch || budgetPeriodFilter) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setBudgetSearch(''); setBudgetPeriodFilter(''); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {loading ? <div className="spinner" /> : filteredBudgets.length === 0 ? (
        <div className="empty-state"><p>{budgets.length === 0 ? 'No budgets yet. Create one to start tracking.' : 'No budgets match your filter.'}</p></div>
      ) : (
        <div className="budget-list">
          {filteredBudgets.map(b => {
            const st = statuses[b._id];
            const isOpen = expanded === b._id;
            const cfg = st ? alertConfig(st.alert) : null;
            return (
              <div key={b._id} className={`budget-card ${isOpen ? 'open' : ''}`}>

                {/* Card Header */}
                <div className="budget-card-header" onClick={() => toggleExpand(b._id)}>
                  <div className="budget-card-info">
                    <div className="budget-card-name">{b.name}</div>
                    <div className="budget-card-meta">
                      R {Number(b.amount).toFixed(2)} · {b.period}
                      {b.categories.length > 0 && ` · ${b.categories.length} categor${b.categories.length > 1 ? 'ies' : 'y'}`}
                    </div>
                  </div>
                  <div className="budget-card-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-outline btn-sm" title="Add expense" onClick={() => openAddExpense(b._id, b.categories)}>
                      <ShoppingBag size={13} />
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => openEditBudget(b)}><Pencil size={13} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBudget(b._id)}><Trash2 size={13} /></button>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleExpand(b._id)}>
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Status */}
                {isOpen && (
                  <div className="budget-card-body">
                    {!st ? <div className="spinner" style={{ margin: '1rem auto' }} /> : (
                      <>
                        {cfg && (
                          <div className="budget-alert" style={{ background: cfg.bg, borderColor: cfg.color, color: cfg.color }}>
                            {cfg.label}
                          </div>
                        )}

                        <div className="budget-stats">
                          <div className="budget-stat-card">
                            <div className="budget-stat-label">Budget</div>
                            <div className="budget-stat-value">R {Number(st.budget).toFixed(2)}</div>
                            <div className="budget-stat-sub">{st.period}</div>
                          </div>
                          <div className="budget-stat-card">
                            <div className="budget-stat-label">Spent</div>
                            <div className="budget-stat-value" style={{ color: st.percentage >= 100 ? '#dc2626' : '#111827' }}>
                              R {Number(st.spent).toFixed(2)}
                            </div>
                            <div className="budget-stat-sub">{st.percentage}% used</div>
                          </div>
                          <div className="budget-stat-card">
                            <div className="budget-stat-label">{st.remaining >= 0 ? 'Remaining' : 'Overdraft'}</div>
                            <div className="budget-stat-value" style={{ color: st.remaining >= 0 ? '#16a34a' : '#7c3aed' }}>
                              R {Math.abs(st.remaining).toFixed(2)}
                            </div>
                            <div className="budget-stat-sub">{st.remaining >= 0 ? 'left to spend' : 'over budget'}</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="budget-bar-track" style={{ marginBottom: '0.5rem' }}>
                          <div className="budget-bar-fill" style={{ width: `${Math.min(st.percentage, 100)}%`, background: barColor(st.percentage) }} />
                          {[50, 75, 100].map(m => (
                            <div key={m} className="budget-bar-marker" style={{ left: `${m}%` }}>
                              <div className="budget-bar-marker-line" />
                              <span className="budget-bar-marker-label">{m}%</span>
                            </div>
                          ))}
                        </div>
                        {st.percentage > 100 && (
                          <div className="budget-overdraft-bar">
                            <div className="budget-overdraft-fill" style={{ width: `${Math.min(st.percentage - 100, 100)}%` }} />
                          </div>
                        )}

                        {/* Category Breakdown */}
                        {st.breakdown?.filter(r => r.total > 0).length > 0 && (
                          <div className="budget-breakdown">
                            <div className="budget-section-title" style={{ marginTop: '1rem' }}>Category Breakdown</div>
                            {st.breakdown.filter(r => r.total > 0).sort((a, b) => b.total - a.total).map(r => (
                              <div key={r.category} className="budget-breakdown-row">
                                <span>{ALL_CATEGORIES.find(c => c.key === r.category)?.label || r.category}</span>
                                <span>R {Number(r.total).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                          onClick={() => openAddExpense(b._id, b.categories)}>
                          <Plus size={15} /> Add Expense to this Budget
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Budget Create/Edit Modal ── */}
      {showBudgetForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editingBudget ? 'Edit Budget' : 'New Budget'}</span>
              <button className="modal-close" onClick={() => setShowBudgetForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleBudgetSubmit}>
              <div className="form-group">
                <label className="form-label">Budget Name</label>
                <input className="form-input" placeholder="e.g. Monthly Groceries" value={budgetForm.name}
                  onChange={e => setBudgetForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount (R)</label>
                  <input className="form-input" type="number" min="1" placeholder="e.g. 3000" value={budgetForm.amount}
                    onChange={e => setBudgetForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Period</label>
                  <select className="form-select" value={budgetForm.period} onChange={e => setBudgetForm(f => ({ ...f, period: e.target.value }))}>
                    {PERIODS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Categories <span style={{ color: '#9ca3af', fontWeight: 400 }}>(leave unchecked to track all)</span>
                </label>
                <div className="budget-cat-grid">
                  {ALL_CATEGORIES.map(c => (
                    <label key={c.key} className={`budget-cat-chip ${budgetForm.categories.includes(c.key) ? 'selected' : ''}`}>
                      <input type="checkbox" checked={budgetForm.categories.includes(c.key)} onChange={() => toggleCategory(c.key)} />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>
              {budgetError && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{budgetError}</p>}
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowBudgetForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={budgetSaving}>
                  {budgetSaving ? 'Saving...' : editingBudget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Expense Modal (saves to category + refreshes budget) ── */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add Expense — {activeBudget?.name}</span>
              <button className="modal-close" onClick={() => setShowExpenseModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleExpSubmit}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={expCategory}
                  onChange={e => { setExpCategory(e.target.value); setExpForm({}); }}>
                  {expCats.map(k => (
                    <option key={k} value={k}>{ALL_CATEGORIES.find(c => c.key === k)?.label || k}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                {expFields.map(f => (
                  <div className="form-group" key={f.name} style={f.full ? { gridColumn: '1/-1' } : {}}>
                    <label className="form-label">{f.label}</label>
                    {f.type === 'select' ? (
                      <select className="form-select" name={f.name} value={expForm[f.name] || ''} onChange={handleExpChange}>
                        <option value="">Select...</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'checkbox' ? (
                      <select className="form-select" name={f.name} value={expForm[f.name] ?? ''} onChange={handleExpChange}>
                        <option value="">Select...</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input className="form-input" type={f.type || 'text'} name={f.name}
                        placeholder={f.label} value={expForm[f.name] || ''} onChange={handleExpChange} />
                    )}
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={expSaving}>
                  {expSaving ? 'Saving...' : 'Add & Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
