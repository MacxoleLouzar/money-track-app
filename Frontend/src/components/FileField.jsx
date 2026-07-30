import { Paperclip } from 'lucide-react';
import '../css/dashboard.css';

export default function FileField({ label, name, onChange, accept = 'image/*,.pdf,.docx' }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <label className="file-input-label">
        <Paperclip size={16} />
        <span>Choose file</span>
        <input type="file" name={name} accept={accept} onChange={onChange} />
      </label>
    </div>
  );
}
