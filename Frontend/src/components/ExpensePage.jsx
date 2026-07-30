import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Image, ChevronLeft, ChevronRight, ScanLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import FileField from './FileField';
import BarcodeScanner from './BarcodeScanner';
import '../css/dashboard.css';

const API = '/api/expenses';
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

  const headers = { Authorization: `Bearer ${token}` };

  const fetchExpenses = () => {
    setLoading(true);
    fetch(`${API}/${category}`, { headers })
      .then(r => r.json())
      .then(data => { setExpenses(Array.isArray(data) ? data : []); setPage(1); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchExpenses(); }, [category]);

  const openAdd = () => { setEditing(null); setForm({}); setFiles({}); setShowModal(true); };

  const handleScan = (value) => {
    setShowScanner(false);
    setEditing(null);
    setFiles({});
    // Fill the first text field + barcode with the scanned value
    const firstTextField = fields.find(f => !f.type || f.type === 'text');
    const prefill = { barcode: value };
    if (firstTextField) prefill[firstTextField.name] = value;
    setForm(prefill);
    setShowModal(true);
  };
  const openEdit = (exp) => { setEditing(exp); setForm({ ...exp }); setFiles({}); setShowModal(true); };

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

  const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));
  const paginated = expenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{expenses.length} record{expenses.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {scannable && (
            <button className="btn btn-outline" onClick={() => setShowScanner(true)}>
              <ScanLine size={16} /> Scan
            </button>
          )}
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add {title}
          </button>
        </div>
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
