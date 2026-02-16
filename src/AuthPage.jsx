import { useState } from "react";
import "./auth.css";

export default function AuthPage({ mode = "login", supabase }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // po rejestracji możesz wymagać potwierdzenia maila – wtedy pokaż komunikat
        window.location.href = "/app";
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/app";
      }
    } catch (err) {
      setError(err?.message || "Błąd logowania");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container">
      <div className="app-content" style={{ maxWidth: 520 }}>
        <div className="card">
          <h2 className="card-title">{isRegister ? "Załóż konto" : "Zaloguj się"}</h2>

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="np. firma@domena.pl"
                required
              />
            </div>

            <div className="form-group">
              <label>Hasło</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min. 6 znaków"
                required
              />
            </div>

            {error ? (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
                {error}
              </div>
            ) : null}

            <div className="buttons-row">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "..." : (isRegister ? "Utwórz konto" : "Zaloguj")}
              </button>

              <a
                className="btn btn-secondary"
                href={isRegister ? "/login" : "/register"}
                style={{ textDecoration: "none" }}
              >
                {isRegister ? "Mam konto" : "Załóż konto"}
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
