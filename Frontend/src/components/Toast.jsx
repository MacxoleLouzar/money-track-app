import { useState, useCallback, useEffect } from 'react';

/**
 * useToast — returns { toasts, toast }
 * toast(message, type) — type: 'success' | 'error' | 'info'
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return { toasts, toast };
}

export function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem',
      alignItems: 'center', pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '0.7rem 1.2rem',
          borderRadius: '999px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#fff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          background: t.type === 'error' ? '#dc2626' : t.type === 'info' ? '#2563eb' : '#16a34a',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'toastIn 0.25s ease',
          whiteSpace: 'nowrap',
          maxWidth: '90vw',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {t.type === 'error' ? '❌' : t.type === 'info' ? 'ℹ️' : '✅'} {t.message}
        </div>
      ))}
    </div>
  );
}
