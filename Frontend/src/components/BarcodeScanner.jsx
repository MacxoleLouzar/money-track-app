import { useState, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, Camera, Upload } from 'lucide-react';

export default function BarcodeScanner({ onScan, onClose }) {
  const [mode, setMode] = useState(null);
  const [error, setError] = useState('');
  const doneRef = useRef(false);
  const fileInputRef = useRef(null);

  const handleScan = (results) => {
    if (doneRef.current || !results?.length) return;
    doneRef.current = true;
    onScan(results[0].rawValue);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');

    if (!('BarcodeDetector' in window)) {
      setError('Image scanning not supported on this browser. Use camera instead.');
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      try {
        const detector = new BarcodeDetector();
        const barcodes = await detector.detect(img);
        if (barcodes.length > 0) onScan(barcodes[0].rawValue);
        else setError('No barcode or QR code found. Try a clearer photo.');
      } catch {
        setError('Could not scan image. Try a clearer photo.');
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <span className="modal-title">Scan Barcode / QR Code</span>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button className="btn btn-primary" style={{ justifyContent: 'center' }}
              onClick={() => { setError(''); doneRef.current = false; setMode('camera'); }}>
              <Camera size={18} /> Use Camera
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'center' }}
              onClick={() => { setError(''); fileInputRef.current?.click(); }}>
              <Upload size={18} /> Scan from Image / Slip
            </button>
          </div>
        )}

        {mode === 'camera' && (
          <div style={{ marginTop: '1rem' }}>
            <Scanner
              onScan={handleScan}
              onError={(e) => setError(String(e))}
              constraints={{ facingMode: 'environment' }}
              styles={{ container: { borderRadius: '0.5rem', overflow: 'hidden' } }}
            />
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem', textAlign: 'center' }}>
              Point camera at barcode or QR code
            </p>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.65rem 0.9rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {mode && (
          <button className="btn btn-outline" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
            onClick={() => { setMode(null); setError(''); }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
