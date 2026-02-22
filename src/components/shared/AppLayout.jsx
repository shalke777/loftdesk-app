// src/components/shared/AppLayout.jsx
// Główny layout aplikacji z boczną nawigacją

import React from 'react';

export function AppLayout({ nav, children, pageTitle, pageSubtitle }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Boczna nawigacja */}
      {nav}

      {/* Główna treść */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Górny pasek */}
        {pageTitle && (
          <div style={{
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            padding: '16px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{pageTitle}</h1>
              {pageSubtitle && <p style={{ margin: 0, fontSize: 13, color: '#64748b', marginTop: 2 }}>{pageSubtitle}</p>}
            </div>
          </div>
        )}

        {/* Zawartość */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}