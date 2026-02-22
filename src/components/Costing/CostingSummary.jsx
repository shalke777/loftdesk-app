// src/components/Costing/CostingSummary.jsx
// Nowoczesne podsumowanie kosztorysu zastępujące stary tekst Netto/VAT/Brutto

import React from 'react';
import { FileText, TrendingUp, Package, Receipt } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2 }) + ' zł';

export function CostingSummary({ lines = [], rates = {}, onGeneratePDF }) {
  let totalNet = 0, totalVat = 0, totalGross = 0;

  lines.forEach((line) => {
    const rate = rates[line.code];
    if (!rate) return;
    const net = rate.priceNet * line.qty;
    const vat = net * rate.vat;
    totalNet   += net;
    totalVat   += vat;
    totalGross += net + vat;
  });

  const materials = totalNet * 0.3;

  const cards = [
    { label: 'Netto',          value: fmt(totalNet),    color: '#3b82f6', bg: '#eff6ff', icon: TrendingUp },
    { label: 'VAT',            value: fmt(totalVat),    color: '#f59e0b', bg: '#fffbeb', icon: Receipt },
    { label: 'Brutto',         value: fmt(totalGross),  color: '#dc2626', bg: '#fef2f2', icon: TrendingUp, big: true },
    { label: 'Materiały (30%)',value: fmt(materials),   color: '#059669', bg: '#f0fdf4', icon: Package },
  ];

  if (lines.length === 0) return null;

  return (
    <div style={{ marginTop: 20, borderTop: '2px solid #f1f5f9', paddingTop: 20 }}>
      {/* Karty podsumowania */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} style={{
              background: c.bg,
              borderRadius: 14,
              padding: '16px 18px',
              border: c.big ? `2px solid ${c.color}30` : '1px solid transparent',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: c.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} color={c.color} />
                </div>
              </div>
              <div style={{ fontSize: c.big ? 22 : 18, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          );
        })}
      </div>

      {/* Przycisk PDF */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onGeneratePDF}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: 'white', border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(220,38,38,0.35)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <FileText size={17} />
          Generuj wycenę PDF
        </button>
      </div>
    </div>
  );
}