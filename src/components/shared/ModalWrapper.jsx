// src/components/shared/ModalWrapper.jsx
// Wrapper który zamienia dowolny formularz w prawidłowy modal z overlay

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

export function ModalWrapper({ title, subtitle, icon: Icon, color = '#dc2626', onClose, children, maxWidth = 760 }) {
  // Blokuj scroll body gdy modal otwarty
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Zamknij na Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.75)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '24px 16px', overflowY: 'auto',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        width: '100%', maxWidth,
        background: 'white', borderRadius: 20,
        boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        marginBottom: 24,
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          padding: '22px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {Icon && (
              <div style={{
                width: 44, height: 44, background: 'rgba(255,255,255,0.2)',
                borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} color="white" />
              </div>
            )}
            <div>
              <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0 }}>{title}</h2>
              {subtitle && <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0 }}>{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={18} color="white" />
          </button>
        </div>

        {/* Treść */}
        <div style={{ padding: '24px 28px' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}