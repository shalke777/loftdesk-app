import React from "react";
import { X, RotateCcw } from "lucide-react";

const DEFAULT_BRAND = {
  primary: "#dc2626",
  primaryDark: "#b91c1c",
  primaryLight: "#fca5a5",
  accent: "#10b981",
};

export function BrandSettings({ brand, setBrand, company, setCompany, onClose }) {
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCompany({ ...company, logo: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetColors = () => {
    if (window.confirm("Czy na pewno chcesz przywrócić domyślne kolory?")) {
      setBrand(DEFAULT_BRAND);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px', width: '90%' }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Ustawienia aplikacji</h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', maxHeight: '70vh', overflow: 'auto' }}>
          
          {/* LOGO FIRMY */}
          <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '15px' }}>Logo firmy</h3>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              {company.logo && (
                <img 
                  src={company.logo} 
                  alt="Logo" 
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    objectFit: 'contain',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '8px',
                    background: '#f8fafc'
                  }} 
                />
              )}
              
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ 
                    width: '100%',
                    padding: '10px',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                />
                
                {company.logo && (
                  <button
                    onClick={() => setCompany({ ...company, logo: "" })}
                    className="btn-secondary"
                    style={{ marginTop: '10px', width: '100%' }}
                  >
                    Usuń logo
                  </button>
                )}
              </div>
            </div>
            
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
              Logo będzie wyświetlane w nagłówku aplikacji. Zalecany rozmiar: 200x200px.
            </p>
          </div>

          {/* KOLORY */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Kolory aplikacji</h3>
              <button
                onClick={handleResetColors}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                <RotateCcw size={14} />
                Przywróć domyślne
              </button>
            </div>

            <div className="form-group">
              <label>Kolor główny</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={brand.primary}
                  onChange={(e) => setBrand({ ...brand, primary: e.target.value })}
                  style={{ width: '50px', height: '50px', cursor: 'pointer', border: 'none', borderRadius: '8px' }}
                />
                <input
                  type="text"
                  value={brand.primary}
                  onChange={(e) => setBrand({ ...brand, primary: e.target.value })}
                  className="input"
                  style={{ flex: 1 }}
                  placeholder="#dc2626"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Kolor ciemniejszy</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={brand.primaryDark}
                  onChange={(e) => setBrand({ ...brand, primaryDark: e.target.value })}
                  style={{ width: '50px', height: '50px', cursor: 'pointer', border: 'none', borderRadius: '8px' }}
                />
                <input
                  type="text"
                  value={brand.primaryDark}
                  onChange={(e) => setBrand({ ...brand, primaryDark: e.target.value })}
                  className="input"
                  style={{ flex: 1 }}
                  placeholder="#b91c1c"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Kolor jaśniejszy</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={brand.primaryLight}
                  onChange={(e) => setBrand({ ...brand, primaryLight: e.target.value })}
                  style={{ width: '50px', height: '50px', cursor: 'pointer', border: 'none', borderRadius: '8px' }}
                />
                <input
                  type="text"
                  value={brand.primaryLight}
                  onChange={(e) => setBrand({ ...brand, primaryLight: e.target.value })}
                  className="input"
                  style={{ flex: 1 }}
                  placeholder="#fca5a5"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Kolor akcentu</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={brand.accent}
                  onChange={(e) => setBrand({ ...brand, accent: e.target.value })}
                  style={{ width: '50px', height: '50px', cursor: 'pointer', border: 'none', borderRadius: '8px' }}
                />
                <input
                  type="text"
                  value={brand.accent}
                  onChange={(e) => setBrand({ ...brand, accent: e.target.value })}
                  className="input"
                  style={{ flex: 1 }}
                  placeholder="#10b981"
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '10px', fontSize: '13px' }}>Podgląd kolorów:</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ 
                  flex: '1 1 100px',
                  height: '60px', 
                  background: brand.primary, 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  Główny
                </div>
                <div style={{ 
                  flex: '1 1 100px',
                  height: '60px', 
                  background: brand.primaryDark, 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  Ciemny
                </div>
                <div style={{ 
                  flex: '1 1 100px',
                  height: '60px', 
                  background: brand.primaryLight, 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  Jasny
                </div>
                <div style={{ 
                  flex: '1 1 100px',
                  height: '60px', 
                  background: brand.accent, 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  Akcent
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}