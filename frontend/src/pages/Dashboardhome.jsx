import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API = "http://127.0.0.1:8000/api";

export default function DashboardHome({ onNavigate }) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/submissions/`)
      .then(r => r.json())
      .then(d => {
        setSubmissions(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const myItems = user.role === "uni_staff"
    ? submissions.filter(s => s.providerName === user.university)
    : submissions;

  const UNIS = ["TU Chemnitz", "University of Girona", "University of Udine"];

  return (
    <div style={{ maxWidth: 820 }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 26, fontWeight: 600, fontFamily: "var(--mono)", color: "var(--text)" }}>
            {loading ? "—" : myItems.length}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            {user.role === "admin" ? "Total submissions" : "My submissions"}
          </div>
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 26, fontWeight: 600, fontFamily: "var(--mono)", color: "#4ade80" }}>
            {user.role === "admin" ? UNIS.length : 1}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            {user.role === "admin" ? "Universities" : "Your university"}
          </div>
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 26, fontWeight: 600, fontFamily: "var(--mono)", color: "#a5b4fc" }}>
            12
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>SPARQL tests active</div>
        </div>
      </div>

      {/* Recent submissions */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Recent submissions</span>
          <button
            onClick={() => onNavigate("submit")}
            style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
          >
            + Submit data
          </button>
        </div>

        {loading && (
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <span className="spinner" />
          </div>
        )}

        {!loading && myItems.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--muted)", padding: "20px 0", textAlign: "center" }}>
            No submissions yet. Submit your first course data.
          </div>
        )}

        {!loading && myItems.slice(0, 8).map((item, i, arr) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#a5b4fc" }}>{item.courseCode}</span>
              <span style={{ fontSize: 12, color: "var(--text)" }}>{item.courseName}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {user.role === "admin" && (
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{item.providerName}</span>
              )}
              <span className="badge badge-info">{item.term ?? "no term"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Admin only — universities overview */}
      {user.role === "admin" && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 14 }}>
            Universities connected
          </div>
          {UNIS.map((uni, i, arr) => {
            const count = submissions.filter(s => s.providerName === uni).length;
            return (
              <div key={uni} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontSize: 13, color: "var(--text)" }}>{uni}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--muted)" }}>{count} submissions</span>
                  <span className="badge badge-info">Connected</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}