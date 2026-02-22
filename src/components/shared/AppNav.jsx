// src/components/shared/AppNav.jsx
// Nowoczesna nawigacja boczna dla LoftDesk

import React, { useState } from 'react';
import {
  LayoutDashboard, FolderKanban, Receipt, FileCheck,
  Users, Download, Upload, Cloud, LogOut, ChevronRight,
  Settings, Zap, Building2
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard',    color: '#6366f1' },
  { id: 'projects',  icon: FolderKanban,   label: 'Projekty',      color: '#dc2626' },
  { id: 'invoices',  icon: Receipt,        label: 'Faktury',       color: '#059669' },
  { id: 'contracts', icon: FileCheck,      label: 'Umowy',         color: '#d97706' },
  { id: 'clients',   icon: Users,          label: 'Kontrahenci',   color: '#7c3aed' },
];

const TOOL_ITEMS = [
  { id: 'export',  icon: Download, label: 'Zapisz kopię'   },
  { id: 'import',  icon: Upload,   label: 'Wczytaj dane'  },
  { id: 'cloud',   icon: Cloud,    label: 'Import z chmury' },
  { id: 'brand',   icon: Settings, label: 'Ustawienia firmy' },
];

export function AppNav({
  plan, invoices, contracts, invoicesLeft,
  onDashboard, onProjects, onInvoices, onContracts, onClients,
  onExport, onImport, onCloud, onBrand,
  onLogout, onUpgradePro,
  activeModule,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const handleNav = (id) => {
    const map = {
      dashboard: onDashboard, projects: onProjects,
      invoices: onInvoices, contracts: onContracts, clients: onClients,
      export: onExport, import: onImport, cloud: onCloud, brand: onBrand,
    };
    map[id]?.();
  };

  const counts = {
    invoices: invoices?.length || 0,
    contracts: contracts?.length || 0,
  };

  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      flexShrink: 0,
      position: 'relative',
    }}>

      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 16px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #dc2626, #ef4444)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Building2 size={20} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>LoftDesk</div>
            <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
              {plan === 'free' ? 'Plan FREE' : plan === 'pro' ? '⚡ PRO' : '🚀 Business'}
            </div>
          </div>
        )}
      </div>

      {/* Główna nawigacja */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '8px 8px 4px', textTransform: 'uppercase' }}>
          {!collapsed && 'Moduły'}
        </div>

        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          const count = counts[item.id];
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 10, padding: collapsed ? '10px 0' : '10px 12px',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: isActive ? '#1e293b' : 'transparent',
                color: isActive ? 'white' : '#94a3b8',
                marginBottom: 2, transition: 'all 0.15s',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
              }}
              onMouseOver={e => !isActive && (e.currentTarget.style.background = '#1e293b')}
              onMouseOut={e => !isActive && (e.currentTarget.style.background = 'transparent')}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '20%', width: 3, height: '60%',
                  background: item.color, borderRadius: '0 3px 3px 0',
                }} />
              )}
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: isActive ? item.color + '20' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={17} color={isActive ? item.color : '#64748b'} />
              </div>
              {!collapsed && (
                <>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: isActive ? 600 : 400, textAlign: 'left' }}>
                    {item.label}
                  </span>
                  {count > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 7px',
                      background: '#1e40af', color: '#93c5fd', borderRadius: 20,
                    }}>
                      {count}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}

        <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '16px 8px 4px', textTransform: 'uppercase' }}>
          {!collapsed && 'Narzędzia'}
        </div>

        {TOOL_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 10, padding: collapsed ? '8px 0' : '8px 12px',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'transparent', color: '#64748b',
                marginBottom: 1, transition: 'all 0.15s', fontSize: 13,
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#1e293b'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icon size={15} />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      {/* Plan upgrade */}
      {!collapsed && plan === 'free' && (
        <div style={{ padding: '12px 12px', borderTop: '1px solid #1e293b' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
            borderRadius: 12, padding: '14px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Zap size={14} color="#fbbf24" />
              <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>Faktury: {invoicesLeft} zostało</span>
            </div>
            <p style={{ color: '#93c5fd', fontSize: 11, margin: '0 0 10px 0' }}>
              Przejdź na PRO — bez limitów!
            </p>
            <button
              onClick={onUpgradePro}
              style={{
                width: '100%', padding: '7px 0', background: 'white',
                color: '#1e40af', border: 'none', borderRadius: 8,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ⚡ Upgrade PRO
            </button>
          </div>
        </div>
      )}

      {/* Wyloguj */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #1e293b' }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: 10, padding: collapsed ? '10px 0' : '10px 12px',
            borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#64748b',
            transition: 'all 0.15s', justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
        >
          <LogOut size={16} />
          {!collapsed && <span style={{ fontSize: 13 }}>Wyloguj</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute', right: -12, top: 72,
          width: 24, height: 24, borderRadius: '50%',
          background: '#1e293b', border: '2px solid #0f172a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#64748b',
        }}
      >
        <ChevronRight size={12} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
      </button>
    </aside>
  );
}