import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const BG = "https://www.tu-chemnitz.de/tu/aktuelles/2022/1669623127_16_9.jpg";

export default function LoginPage() {
  const { login, error } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    login(email, password);
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: `url(${BG})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    }}>
      {/* dark overlay so card is readable */}
      <div style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)",
      }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>

        {/* Title above card */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
            Across KG Quality Platform
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
            Federated University Knowledge Graph
          </div>
        </div>

        {/* Login card */}
        <div style={{
          background: "#fff",
          borderRadius: 8,
          padding: 28,
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e", marginBottom: 18 }}>
            University Staff Sign In
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 13 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="staff@tu-chemnitz.de"
                required
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={{ fontSize: 12, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, padding: "7px 10px", marginBottom: 14 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{ width: "100%", padding: "10px 0", background: "#2563eb", color: "#fff", fontWeight: 500, fontSize: 13, border: "none", borderRadius: 6, cursor: "pointer" }}
            >
              Sign in
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
          TU Chemnitz · University of Girona · University of Udine
        </div>
      </div>
    </div>
  );
}