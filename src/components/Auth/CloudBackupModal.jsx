// src/components/Auth/CloudBackupModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  saveBackupToCloud,
  listCloudBackups,
  restoreBackupFromCloud,
  deleteCloudBackup,
} from '../../utils/cloudBackup';
import { Cloud, Download, Trash2, Upload, LogOut, Mail, Lock, X } from 'lucide-react';

export function CloudBackupModal({ onClose }) {
  const { user, signIn, signUp, signOut, isEnabled } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setMode('backups');
      loadBackups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadBackups = async () => {
    try {
      const data = await listCloudBackups();
      setBackups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password);
        alert('Konto utworzone! Sprawdź email aby potwierdzić.');
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      alert(error?.message || 'Błąd logowania.');
    } finally {
      setLoading(false);
    }
  };
const handleSignOut = async () => {
  try {
    // Zapisz dane przed wylogowaniem
    await saveBackupToCloud('Backup przy wylogowaniu');
    await signOut();
  } catch (error) {
    console.error(error);
    await signOut(); // Wyloguj nawet jeśli backup failed
  }
};
  const handleSaveBackup = async () => {
    setLoading(true);
    try {
      const name = prompt('Nazwa backupu:', `Backup ${new Date().toLocaleDateString()}`);
      if (!name) return;
      await saveBackupToCloud(name);
      alert('Backup zapisany w chmurze!');
      await loadBackups();
    } catch (error) {
      alert(error?.message || 'Nie udało się zapisać backupu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backupId) => {
    if (!window.confirm('Przywrócić dane z tego backupu? Nadpisze lokalne dane!')) return;
    setLoading(true);
    try {
      await restoreBackupFromCloud(backupId);
      alert('Backup przywrócony! Odświeżam...');
      window.location.reload();
    } catch (error) {
      alert(error?.message || 'Nie udało się przywrócić backupu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (backupId) => {
    if (!window.confirm('Usunąć ten backup?')) return;
    try {
      await deleteCloudBackup(backupId);
      await loadBackups();
    } catch (error) {
      alert(error?.message || 'Nie udało się usunąć backupu.');
    }
  };

  if (!isEnabled) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <div style={headerStyle}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Cloud size={20} /> Cloud Backup
            </h2>
            <button onClick={onClose} style={closeButtonStyle} aria-label="Zamknij">
              <X size={20} />
            </button>
          </div>
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p>Cloud backup nie jest skonfigurowany.</p>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Dodaj plik .env z kluczami Supabase aby włączyć tę funkcję.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cloud size={20} /> Cloud Backup
          </h2>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Zamknij">
            <X size={20} />
          </button>
        </div>

        {!user ? (
          <form onSubmit={handleAuth} style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                <Mail size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                placeholder="twoj@email.com"
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>
                <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Hasło
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="••••••••"
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? '...' : mode === 'signup' ? 'Utwórz konto' : 'Zaloguj się'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                style={linkButtonStyle}
              >
                {mode === 'signup' ? 'Mam już konto' : 'Nie mam konta'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ padding: '24px' }}>
            <div style={userBoxStyle}>
              <div style={{ fontSize: '14px', color: '#666' }}>Zalogowany jako:</div>
              <div style={{ fontWeight: 800 }}>{user.email}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <button onClick={handleSaveBackup} disabled={loading} style={primaryButtonInlineStyle}>
                <Upload size={16} style={{ marginRight: '8px' }} />
                Zapisz backup
              </button>
              <button onClick={handleSignOut} style={secondaryButtonStyle}>
  <LogOut size={16} style={{ marginRight: '8px' }} />
  Wyloguj
</button>
              
            </div>

            <h3 style={{ marginBottom: '16px' }}>Twoje backupy:</h3>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {backups.length === 0 ? (
                <div style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                  Brak zapisanych backupów w chmurze.
                </div>
              ) : (
                backups.map((b) => (
                  <div key={b.id ?? `${b.name}-${b.created_at ?? ''}`} style={backupRowStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800 }}>{b.name || 'Backup'}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {b.created_at ? new Date(b.created_at).toLocaleString() : ''}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestore(b.id)}
                      disabled={loading}
                      title="Przywróć"
                      style={iconButtonStyle}
                    >
                      <Download size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={loading}
                      title="Usuń"
                      style={dangerIconButtonStyle}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------
// Styles
// -----------------
const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '16px',
};

const modalStyle = {
  width: '100%',
  maxWidth: '560px',
  background: '#fff',
  borderRadius: '14px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  overflow: 'hidden',
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 18px',
  borderBottom: '1px solid #eee',
};

const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: '8px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: 800,
};

const inputStyle = {
  width: '100%',
  padding: '12px 12px',
  borderRadius: '10px',
  border: '1px solid #ddd',
  outline: 'none',
};

const primaryButtonStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 900,
};

const primaryButtonInlineStyle = {
  padding: '12px 14px',
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 900,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const secondaryButtonStyle = {
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid #ddd',
  cursor: 'pointer',
  background: '#fff',
  fontWeight: 900,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const linkButtonStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#2563eb',
  fontWeight: 900,
};

const userBoxStyle = {
  marginBottom: '16px',
  padding: '12px',
  background: '#f0f9ff',
  borderRadius: '8px',
};

const backupRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px',
  border: '1px solid #eee',
  borderRadius: '10px',
  marginBottom: '10px',
};

const iconButtonStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  border: '1px solid #ddd',
  background: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const dangerIconButtonStyle = {
  ...iconButtonStyle,
  border: '1px solid #f1c0c0',
};
