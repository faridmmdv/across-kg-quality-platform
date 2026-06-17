import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API = "http://127.0.0.1:8000/api";

function fairColor(score) {
  if (score === null || score === undefined) return "#6b7280";
  if (score >= 0.7) return "#16a34a";
  if (score >= 0.5) return "#d97706";
  return "#dc2626";
}

function OverallBadge({ value }) {
  if (!value) return <span style={{ fontSize: 11, color: "#6b7280" }}>—</span>;
  const color = value === "PASS" ? "#16a34a" : "#dc2626";
  const bg    = value === "PASS" ? "#f0fdf4" : "#fef2f2";
  const border = value === "PASS" ? "#bbf7d0" : "#fecaca";
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 8px",
      borderRadius: 20, background: bg, color, border: `1px solid ${border}`,
    }}>
      {value}
    </span>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterUni, setFilterUni] = useState("all");

  const UNIS = ["TU Chemnitz", "University of Girona", "University of Udine"];

  useEffect(() => {
    fetch(`${API}/submissions/`)
      .then(r => r.json())
      .then(d => {
        const all = Array.isArray(d) ? d : [];
        setItems(user.role === "uni_staff"
          ? all.filter(i => i.providerName === user.university)
          : all
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = items.filter(i => {
    const matchSearch =
      i.courseCode?.toLowerCase().includes(search.toLowerCase()) ||
      i.courseName?.toLowerCase().includes(search.toLowerCase()) ||
      i.instructorName?.toLowerCase().includes(search.toLowerCase());
    const matchUni = filterUni === "all" || i.providerName === filterUni;
    return matchSearch && matchUni;
  });

  return (
    <div style={{ maxWidth: 1000 }}>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by course code, name or instructor..."
          style={{ maxWidth: 320, flex: 1 }}
        />
        {user.role === "admin" && (
          <select
            value={filterUni}
            onChange={e => setFilterUni(e.target.value)}
            style={{ fontSize: 13, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", cursor: "pointer" }}
          >
            <option value="all">All universities</option>
            {UNIS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>

        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "100px 1fr 140px 90px 70px 70px 60px",
          padding: "10px 16px",
          background: "var(--card2)",
          borderBottom: "1px solid var(--border)",
        }}>
          {["Code", "Course name", "University", "Instructor", "Result", "FAIR", "SHACL"].map(h => (
            <span key={h} style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)", letterSpacing: ".06em" }}>
              {h.toUpperCase()}
            </span>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: 32, textAlign: "center" }}>
            <span className="spinner" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
            {search ? "No results match your search." : "No submissions found."}
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.map((item, i, arr) => (
          <div
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "100px 1fr 140px 90px 70px 70px 60px",
              padding: "11px 16px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#a5b4fc" }}>
              {item.courseCode}
            </span>
            <span style={{ fontSize: 12, color: "var(--text)", paddingRight: 8 }}>
              {item.courseName}
            </span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              {item.providerName}
            </span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              {item.instructorName}
            </span>
            <span>
              <OverallBadge value={item.qualityOverall} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: fairColor(item.qualityFairScore) }}>
              {item.qualityFairScore !== null && item.qualityFairScore !== undefined
                ? item.qualityFairScore.toFixed(2)
                : "—"}
            </span>
            <span style={{ fontSize: 12, color: item.qualityShacl > 0 ? "#dc2626" : "#16a34a" }}>
              {item.qualityShacl !== null && item.qualityShacl !== undefined
                ? item.qualityShacl === 0 ? "✓" : `${item.qualityShacl}✗`
                : "—"}
            </span>
          </div>
        ))}
      </div>

      {/* Count */}
      {!loading && (
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
          {filtered.length} submission{filtered.length !== 1 ? "s" : ""} {search ? "found" : "total"}
          {filtered.filter(i => i.qualityOverall === "PASS").length > 0 && (
            <span style={{ marginLeft: 12, color: "#16a34a" }}>
              ✓ {filtered.filter(i => i.qualityOverall === "PASS").length} passed
            </span>
          )}
          {filtered.filter(i => i.qualityOverall === "FAIL").length > 0 && (
            <span style={{ marginLeft: 8, color: "#dc2626" }}>
              ✗ {filtered.filter(i => i.qualityOverall === "FAIL").length} failed
            </span>
          )}
        </div>
      )}
    </div>
  );
}