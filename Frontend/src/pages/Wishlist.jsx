import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil, X, CheckCircle2, Circle } from 'lucide-react';
import '../css/dashboard.css';
import '../css/wishlist.css';

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

const catLabel = (key) => ALL_CATEGORIES.find(c => c.key === key)?.label || key;

export default function Wishlist() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [lists, setLists]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  // Wishlist create/edit
  const [showListForm, setShowListForm] = useState(false);
  const [editingList, setEditingList]   = useState(null);
  const [listForm, setListForm]         = useState({ name: '', period: 'weekly' });
  const [listSaving, setListSaving]     = useState(false);
  const [listError, setListError]       = useState('');

  // Add item
  const [showItemForm, setShowItemForm]   = useState(false);
  const [activeListId, setActiveListId]   = useState(null);
  const [itemForm, setItemForm]           = useState({ name: '', category: 'grocery', note: '' });
  const [itemSaving, setItemSaving]       = useState(false);

  const fetchLists = async () => {
    setLoading(true);
    const res = await fetch('/api/wishlist', { headers });
    const data = await res.json();
    setLists(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchLists(); }, []);

  const toggleExpand = (id) => setExpanded(e => e === id ? null : id);

  // ── List CRUD ────────────────────────────────────────
  const openCreateList = () => { setEditingList(null); setListForm({ name: '', period: 'weekly' }); setListError(''); setShowListForm(true); };
  const openEditList = (l) => { setEditingList(l); setListForm({ name: l.name, period: l.period }); setListError(''); setShowListForm(true); };

  const handleListSubmit = async e => {
    e.preventDefault();
    if (!listForm.name.trim()) { setListError('Name is required.'); return; }
    setListSaving(true); setListError('');
    if (editingList) {
      const res = await fetch(`/api/wishlist/${editingList._id}`, { method: 'PUT', headers, body: JSON.stringify(listForm) });
      const updated = await res.json();
      setLists(ls => ls.map(l => l._id === updated._id ? updated : l));
    } else {
      await fetch('/api/wishlist', { method: 'POST', headers, body: JSON.stringify(listForm) });
      fetchLists();
    }
    setListSaving(false);
    setShowListForm(false);
  };

  const handleDeleteList = async (id) => {
    if (!confirm('Delete this wishlist?')) return;
    await fetch(`/api/wishlist/${id}`, { method: 'DELETE', headers });
    setLists(ls => ls.filter(l => l._id !== id));
    if (expanded === id) setExpanded(null);
  };

  // ── Item CRUD ────────────────────────────────────────
  const openAddItem = (listId) => { setActiveListId(listId); setItemForm({ name: '', category: 'grocery', note: '' }); setShowItemForm(true); };

  const handleItemSubmit = async e => {
    e.preventDefault();
    if (!itemForm.name.trim()) return;
    setItemSaving(true);
    const res = await fetch(`/api/wishlist/${activeListId}/items`, { method: 'POST', headers, body: JSON.stringify(itemForm) });
    const updated = await res.json();
    setLists(ls => ls.map(l => l._id === updated._id ? updated : l));
    setItemSaving(false);
    setShowItemForm(false);
  };

  const handleRemoveItem = async (listId, itemId) => {
    const res = await fetch(`/api/wishlist/${listId}/items/${itemId}`, { method: 'DELETE', headers });
    const updated = await res.json();
    setLists(ls => ls.map(l => l._id === updated._id ? updated : l));
  };

  const handleTick = async (listId, itemId, current) => {
    const res = await fetch(`/api/wishlist/${listId}/items/${itemId}/tick`, {
      method: 'PATCH', headers, body: JSON.stringify({ bought: !current }),
    });
    const updated = await res.json();
    setLists(ls => ls.map(l => l._id === updated._id ? updated : l));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Wishlist / Plan to Buy</h1>
          <p className="page-subtitle">{lists.length} list{lists.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateList}>
          <Plus size={16} /> <span className="btn-label">New List</span>
        </button>
      </div>

      {loading ? <div className="spinner" /> : lists.length === 0 ? (
        <div className="empty-state"><p>No wishlists yet. Create one to start planning.</p></div>
      ) : (
        <div className="wl-list">
          {lists.map(l => {
            const isOpen = expanded === l._id;
            const bought = l.items.filter(i => i.bought).length;
            const total  = l.items.length;
            const pct    = total > 0 ? Math.round((bought / total) * 100) : 0;

            return (
              <div key={l._id} className={`wl-card ${isOpen ? 'open' : ''}`}>

                {/* Header */}
                <div className="wl-card-header" onClick={() => toggleExpand(l._id)}>
                  <div className="wl-card-info">
                    <div className="wl-card-name">{l.name}</div>
                    <div className="wl-card-meta">
                      {l.period} · {bought}/{total} bought
                      {total > 0 && <span className="wl-pct-badge" style={{ background: pct === 100 ? '#dcfce7' : '#f3f4f6', color: pct === 100 ? '#16a34a' : '#6b7280' }}>{pct}%</span>}
                    </div>
                  </div>
                  <div className="wl-card-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-outline btn-sm" onClick={() => { setActiveListId(l._id); openAddItem(l._id); }}><Plus size={13} /></button>
                    <button className="btn btn-outline btn-sm" onClick={() => openEditList(l)}><Pencil size={13} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteList(l._id)}><Trash2 size={13} /></button>
                    <button className="btn btn-outline btn-sm">{isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
                  </div>
                </div>

                {/* Progress bar */}
                {total > 0 && (
                  <div className="wl-progress-track">
                    <div className="wl-progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? '#16a34a' : '#a8d8ea' }} />
                  </div>
                )}

                {/* Items */}
                {isOpen && (
                  <div className="wl-card-body">
                    {l.items.length === 0 ? (
                      <p className="wl-empty">No items yet. Tap + to add.</p>
                    ) : (
                      <ul className="wl-items">
                        {l.items.map(item => (
                          <li key={item._id} className={`wl-item ${item.bought ? 'bought' : ''}`}>
                            <button className="wl-tick" onClick={() => handleTick(l._id, item._id, item.bought)}>
                              {item.bought
                                ? <CheckCircle2 size={20} color="#16a34a" />
                                : <Circle size={20} color="#d1d5db" />}
                            </button>
                            <div className="wl-item-info">
                              <span className="wl-item-name">{item.name}</span>
                              <span className="wl-item-cat">{catLabel(item.category)}</span>
                              {item.note && <span className="wl-item-note">{item.note}</span>}
                              {item.bought && item.boughtAt && (
                                <span className="wl-item-bought-at">✓ Bought {new Date(item.boughtAt).toLocaleDateString()}</span>
                              )}
                            </div>
                            <button className="wl-remove" onClick={() => handleRemoveItem(l._id, item._id)}>
                              <X size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button className="btn btn-outline" style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
                      onClick={() => openAddItem(l._id)}>
                      <Plus size={15} /> Add Item
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create/Edit List Modal ── */}
      {showListForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editingList ? 'Edit List' : 'New Wishlist'}</span>
              <button className="modal-close" onClick={() => setShowListForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleListSubmit}>
              <div className="form-group">
                <label className="form-label">List Name</label>
                <input className="form-input" placeholder="e.g. Weekly Groceries" value={listForm.name}
                  onChange={e => setListForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Period</label>
                <select className="form-select" value={listForm.period} onChange={e => setListForm(f => ({ ...f, period: e.target.value }))}>
                  {PERIODS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              {listError && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{listError}</p>}
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowListForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={listSaving}>
                  {listSaving ? 'Saving...' : editingList ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Item Modal ── */}
      {showItemForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add Item</span>
              <button className="modal-close" onClick={() => setShowItemForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleItemSubmit}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input className="form-input" placeholder="e.g. Milk" value={itemForm.name}
                  onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))}>
                  {ALL_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Note <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <input className="form-input" placeholder="e.g. 2L full cream" value={itemForm.note}
                  onChange={e => setItemForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowItemForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={itemSaving}>
                  {itemSaving ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
