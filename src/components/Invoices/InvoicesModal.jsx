import React, { useState, useMemo } from "react";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  FileText,
  CheckCircle,
  XCircle,
  Download
} from "lucide-react";
import { formatPL, currency } from "../../utils/format";

export const InvoicesModal = ({ 
  open, 
  onClose, 
  invoices,
  onRemove,
  onMarkAsPaid,
  onGeneratePDF,
  onCreateNew
}) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, paid, unpaid

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        !search ||
        inv.number.toLowerCase().includes(search.toLowerCase()) ||
        inv.buyer.name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "paid" && inv.isPaid) ||
        (filterStatus === "unpaid" && !inv.isPaid);

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, filterStatus]);

  const summary = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + inv.summary.gross, 0);
    const paid = invoices
      .filter((inv) => inv.isPaid)
      .reduce((sum, inv) => sum + inv.summary.gross, 0);
    const unpaid = total - paid;

    return { total, paid, unpaid };
  }, [invoices]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '1400px' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            <FileText size={24} />
            Faktury VAT
          </h2>
          <button className="modal-close" onClick={onClose}>
            <XCircle size={20} />
          </button>
        </div>

        <div className="modal-toolbar">
          <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder="Szukaj po numerze lub nazwie nabywcy..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="modal-search"
              style={{ paddingLeft: "40px" }}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
            style={{ width: "150px" }}
          >
            <option value="all">Wszystkie</option>
            <option value="paid">Opłacone</option>
            <option value="unpaid">Nieopłacone</option>
          </select>

          <button
            onClick={onCreateNew}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={18} />
            Nowa faktura
          </button>
        </div>

        {/* PODSUMOWANIE */}
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          <div className="grid-4" style={{ gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Wszystkie faktury</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>{invoices.length}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Łączna wartość</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>{currency(summary.total)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#16a34a', marginBottom: '4px' }}>Opłacone</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>{currency(summary.paid)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '4px' }}>Do zapłaty</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>{currency(summary.unpaid)}</div>
            </div>
          </div>
        </div>

        <div className="modal-content">
          {filtered.length === 0 ? (
            <div className="empty-state">
              {search || filterStatus !== "all" ? (
                <>
                  <Search size={48} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
                  <div>Brak wyników wyszukiwania</div>
                </>
              ) : (
                <>
                  <FileText size={48} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
                  <div>Brak faktur</div>
                  <div style={{ fontSize: "14px", color: "#94a3b8", marginTop: "8px" }}>
                    Kliknij "Nowa faktura" aby rozpocząć
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Numer</th>
                    <th>Data wystawienia</th>
                    <th>Termin płatności</th>
                    <th>Nabywca</th>
                    <th style={{ textAlign: "right" }}>Wartość netto</th>
                    <th style={{ textAlign: "right" }}>VAT</th>
                    <th style={{ textAlign: "right" }}>Wartość brutto</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th style={{ textAlign: "center" }}>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600 }}>{inv.number}</td>
                      <td>{formatPL(inv.issueDate)}</td>
                      <td>{formatPL(inv.dueDate)}</td>
                      <td>{inv.buyer.name}</td>
                      <td style={{ textAlign: "right" }}>{currency(inv.summary.net)}</td>
                      <td style={{ textAlign: "right" }}>{currency(inv.summary.vat)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {currency(inv.summary.gross)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {inv.isPaid ? (
                          <span
                            style={{
                              padding: "4px 12px",
                              backgroundColor: "#dcfce7",
                              color: "#166534",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <CheckCircle size={14} />
                            Opłacona
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: "4px 12px",
                              backgroundColor: "#fee2e2",
                              color: "#991b1b",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <XCircle size={14} />
                            Nieopłacona
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            onClick={() => onGeneratePDF(inv)}
                            className="btn btn-secondary"
                            style={{
                              padding: "4px 8px",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="Pobierz PDF"
                          >
                            <Download size={14} />
                          </button>
                          {!inv.isPaid && (
                            <button
                              onClick={() => onMarkAsPaid(inv.id)}
                              className="btn btn-secondary"
                              style={{
                                padding: "4px 8px",
                                fontSize: "12px",
                                color: "#16a34a",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title="Oznacz jako opłaconą"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => onRemove(inv.id)}
                            className="btn btn-secondary"
                            style={{
                              padding: "4px 8px",
                              fontSize: "12px",
                              color: "#dc2626",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="Usuń"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          Łącznie faktur: <strong>{invoices.length}</strong>
        </div>
      </div>
    </div>
  );
};