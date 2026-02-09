import React, { useState, useMemo } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  FileText,
  CheckCircle,
  XCircle,
  Download
} from "lucide-react";
import { formatPL, currency } from "../../utils/format";

export const ContractsModal = ({ 
  open, 
  onClose, 
  contracts,
  onRemove,
  onMarkAsSigned,
  onGeneratePDF,
  onCreateNew
}) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, signed, unsigned

  const filtered = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesSearch =
        !search ||
        contract.number.toLowerCase().includes(search.toLowerCase()) ||
        contract.buyer.name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "signed" && contract.isSigned) ||
        (filterStatus === "unsigned" && !contract.isSigned);

      return matchesSearch && matchesStatus;
    });
  }, [contracts, search, filterStatus]);

  const summary = useMemo(() => {
    const total = contracts.reduce((sum, c) => sum + c.totalAmount, 0);
    const signed = contracts
      .filter((c) => c.isSigned)
      .reduce((sum, c) => sum + c.totalAmount, 0);
    const unsigned = total - signed;

    return { total, signed, unsigned };
  }, [contracts]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '1400px' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            <FileText size={24} />
            Umowy
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
              placeholder="Szukaj po numerze lub nazwie..."
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
            <option value="signed">Podpisane</option>
            <option value="unsigned">Niepodpisane</option>
          </select>

          <button
            onClick={onCreateNew}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={18} />
            Nowa umowa
          </button>
        </div>

        {/* PODSUMOWANIE */}
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          <div className="grid-4" style={{ gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Wszystkie umowy</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>{contracts.length}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Łączna wartość</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>{currency(summary.total)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#16a34a', marginBottom: '4px' }}>Podpisane</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>{currency(summary.signed)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '4px' }}>Niepodpisane</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>{currency(summary.unsigned)}</div>
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
                  <div>Brak umów</div>
                  <div style={{ fontSize: "14px", color: "#94a3b8", marginTop: "8px" }}>
                    Kliknij "Nowa umowa" aby rozpocząć
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
                    <th>Data zawarcia</th>
                    <th>Termin realizacji</th>
                    <th>Zamawiający</th>
                    <th style={{ textAlign: "right" }}>Wartość brutto</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th style={{ textAlign: "center" }}>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contract) => (
                    <tr key={contract.id}>
                      <td style={{ fontWeight: 600 }}>{contract.number}</td>
                      <td>{formatPL(contract.contractDate)}</td>
                      <td>{formatPL(contract.completionDate)}</td>
                      <td>{contract.buyer.name}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {currency(contract.totalAmount)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {contract.isSigned ? (
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
                            Podpisana
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
                            Niepodpisana
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            onClick={() => onGeneratePDF(contract)}
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
                          {!contract.isSigned && (
                            <button
                              onClick={() => onMarkAsSigned(contract.id)}
                              className="btn btn-secondary"
                              style={{
                                padding: "4px 8px",
                                fontSize: "12px",
                                color: "#16a34a",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title="Oznacz jako podpisaną"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => onRemove(contract.id)}
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
          Łącznie umów: <strong>{contracts.length}</strong>
        </div>
      </div>
    </div>
  );
};