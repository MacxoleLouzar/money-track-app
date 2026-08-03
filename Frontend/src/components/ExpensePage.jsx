import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Image, ChevronLeft, ChevronRight, ScanLine, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import FileField from './FileField';
import BarcodeScanner from './BarcodeScanner';
import '../css/dashboard.css';

import { API_URL } from '../utils/api';

const API = `${API_URL}/expenses`;
const PAGE_SIZE = 10;

export default function ExpensePage({ category, title, fields, scannable = false }) {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [showScanner, setShowScanner] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchExpenses = () => {
    setLoading(true);
    fetch(`${API}/${category}`, { headers })
      .then(r => r.json())
      .then(data => { setExpenses(Array.isArray(data) ? data : []); setPage(1); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchExpenses(); }, [category]);

  const openAdd = () => { setEditing(null); setForm({ date: new Date().toISOString().split('T')[0] }); setFiles({}); setShowModal(true); };

  const handleScan = async (value) => {
    setShowScanner(false);
    setEditing(null);
    setFiles({});
    const today = new Date().toISOString().split('T')[0];
    const prefill = { barcode: value, date: today };

    // Look up product name from Open Food Facts
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${value}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const name = p.product_name || p.product_name_en || '';
        const brand = p.brands || '';
        const store = p.stores || '';
        const productName = [brand, name].filter(Boolean).join(' - ') || name;

        const firstTextField = fields.find(f => !f.type || f.type === 'text');
        if (firstTextField) prefill[firstTextField.name] = productName;
        if (fields.find(f => f.name === 'store') && store) prefill.store = store.split(',')[0].trim();
      } else {
        // Not found — just put barcode in first text field
        const firstTextField = fields.find(f => !f.type || f.type === 'text');
        if (firstTextField) prefill[firstTextField.name] = value;
      }
    } catch {
      const firstTextField = fields.find(f => !f.type || f.type === 'text');
      if (firstTextField) prefill[firstTextField.name] = value;
    }

    setForm(prefill);
    setShowModal(true);
  };
  const openEdit = (exp) => {
    setEditing(exp);
    setForm({ ...exp, date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0] });
    setFiles({});
    setShowModal(true);
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleFile = e => setFiles(f => ({ ...f, [e.target.name]: e.target.files[0] }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    const hasFile = Object.keys(files).length > 0;
    let body, contentType;

    if (hasFile) {
      body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      Object.entries(files).forEach(([k, v]) => body.append(k, v));
    } else {
      body = JSON.stringify(form);
      contentType = 'application/json';
    }

    const url = editing ? `${API}/${category}/${editing._id}` : `${API}/${category}`;
    const method = editing ? 'PUT' : 'POST';
    const reqHeaders = { Authorization: `Bearer ${token}`, ...(contentType ? { 'Content-Type': contentType } : {}) };

    await fetch(url, { method, headers: reqHeaders, body });
    setSaving(false);
    setShowModal(false);
    fetchExpenses();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await fetch(`${API}/${category}/${id}`, { method: 'DELETE', headers });
    fetchExpenses();
  };

  const displayFields = fields.filter(f => f.type !== 'file');
  const fileFields = fields.filter(f => f.type === 'file');

  const filtered = expenses.filter(exp => {
    const q = search.toLowerCase();
    const matchSearch = !q || displayFields.some(f => String(exp[f.name] ?? '').toLowerCase().includes(q));
    const expDate = exp.date ? new Date(exp.date) : null;
    const matchFrom = !dateFrom || (expDate && expDate >= new Date(dateFrom));
    const matchTo   = !dateTo   || (expDate && expDate <= new Date(dateTo + 'T23:59:59'));
    return matchSearch && matchFrom && matchTo;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setPage(1); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{filtered.length} of {expenses.length} record{expenses.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          {scannable && (
            <button className="btn btn-outline" onClick={() => setShowScanner(true)}>
              <ScanLine size={16} /> <span className="btn-label">Scan</span>
            </button>
          )}
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> <span className="btn-label">Add {title}</span>
          </button>
        </div>
      </div>

      {/* Mobile floating Add button */}
      <button className="fab" onClick={openAdd} title={`Add ${title}`}>
        <Plus size={22} />
      </button>

      <div className="filter-bar">
        <div className="filter-search">
          <Search size={15} className="filter-search-icon" />
          <input className="filter-input" placeholder="Search..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <input className="filter-input filter-date" type="date" value={dateFrom} title="From date"
          onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
        <input className="filter-input filter-date" type="date" value={dateTo} title="To date"
          onChange={e => { setDateTo(e.target.value); setPage(1); }} />
        {(search || dateFrom || dateTo) && (
          <button className="btn btn-outline btn-sm" onClick={clearFilters}><X size={14} /> Clear</button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="spinner" />
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <p>No {title.toLowerCase()} recorded yet.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {displayFields.map(f => <th key={f.name}>{f.label}</th>)}
                    <th>Date</th>
                    <th>Files</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(exp => (
                    <tr key={exp._id}>
                      {displayFields.map(f => (
                        <td key={f.name}>
                          {f.name === 'price'
                            ? `R ${Number(exp[f.name] || 0).toFixed(2)}`
                            : f.name === 'onSale'
                            ? <span className={`badge ${exp[f.name] ? 'badge-green' : 'badge-gray'}`}>{exp[f.name] ? 'Yes' : 'No'}</span>
                            : exp[f.name] ?? '—'}
                        </td>
                      ))}
                      <td>{exp.date ? new Date(exp.date).toLocaleDateString() : '—'}</td>
                      <td>
                        {(exp.image || exp.slip || exp.invoice) ? (
                          <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Image size={12} /> Files
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(exp)}><Pencil size={14} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exp._id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft size={16} />
                </button>
                <span className="page-info">Page {page} of {totalPages}</span>
                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {showModal && (
        <Modal title={editing ? `Edit ${title}` : `Add ${title}`} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              {displayFields.map(f => (
                <div className="form-group" key={f.name} style={f.full ? { gridColumn: '1/-1' } : {}}>
                  <label className="form-label">{f.label}</label>
                  {f.type === 'select' ? (
                    <select className="form-select" name={f.name} value={form[f.name] || ''} onChange={handleChange}>
                      <option value="">Select...</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === 'checkbox' ? (
                    <select className="form-select" name={f.name} value={form[f.name] ?? ''} onChange={handleChange}>
                      <option value="">Select...</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      className="form-input"
                      type={f.type || 'text'}
                      name={f.name}
                      placeholder={f.label}
                      value={form[f.name] || ''}
                      onChange={handleChange}
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {fileFields.map(f => (
                <div key={f.name} style={{ flex: 1, minWidth: '140px' }}>
                  <FileField label={f.label} name={f.name} onChange={handleFile} />
                  {files[f.name] && <div className="file-name">{files[f.name].name}</div>}
                </div>
              ))}
            </div>
            {/* Date field — always editable */}
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Date</label>
              <input className="form-input" type="date" name="date" value={form.date || ''} onChange={handleChange} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
