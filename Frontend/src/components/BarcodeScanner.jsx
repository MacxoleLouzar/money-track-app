import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Upload } from 'lucide-react';

export default function BarcodeScanner({ onScan, onClose }) {
  const [mode, setMode] = useState(null); // 'camera' | 'file'
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const scannedRef = useRef(false);
  const SCANNER_ID = 'qr-scanner-region';

  // Start camera scan
  const startCamera = async () => {
    setMode('camera');
    setError('');
    setScanning(true);
  };

  useEffect(() => {
    if (mode !== 'camera' || !scanning) return;

    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;

    scannedRef.current = false;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      (decodedText) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        scanner.stop().catch(() => {}).finally(() => onScan(decodedText));
      },
      () => {}
    ).catch(() => {
      setError('Camera access denied or not available.');
      setScanning(false);
    });

    return () => {
      if (!scannedRef.current) scanner.stop().catch(() => {});
    };
  }, [mode, scanning]);

  // Scan from uploaded image
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    const scanner = new Html5Qrcode('qr-file-scanner');
    try {
      const result = await scanner.scanFile(file, true);
      await scanner.clear().catch(() => {});
      onScan(result);
    } catch {
      setError('No barcode or QR code found in the image. Try a clearer photo.');
      scanner.clear().catch(() => {});
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <span className="modal-title">Scan Barcode / QR Code</span>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={startCamera}>
              <Camera size={18} /> Use Camera
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => { setMode('file'); fileInputRef.current?.click(); }}>
              <Upload size={18} /> Scan from Image / Slip
            </button>
          </div>
        )}

        {mode === 'camera' && (
          <div style={{ marginTop: '1rem' }}>
            <div id={SCANNER_ID} style={{ width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }} />
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.75rem', textAlign: 'center' }}>
              Point camera at barcode or QR code
            </p>
          </div>
        )}

        {/* Hidden elements for file scanning */}
        <div id="qr-file-scanner" style={{ display: 'none' }} />
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.65rem 0.9rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {mode && (
          <button className="btn btn-outline" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
            onClick={() => { setMode(null); setError(''); setScanning(false); }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
