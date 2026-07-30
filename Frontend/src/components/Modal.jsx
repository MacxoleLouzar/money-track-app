import { X } from 'lucide-react';
import '../css/dashboard.css';

export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
