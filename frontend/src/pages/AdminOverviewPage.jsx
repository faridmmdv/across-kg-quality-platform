import { useEffect, useState, useCallback } from "react";
import "./AdminOverviewPage.css";

const API = "http://127.0.0.1:8000/api";
const UNIS = ["TU Chemnitz", "University of Girona", "University of Udine"];

function scoreColor(score) {
  if (score >= 0.7) return "#16a34a";
  if (score >= 0.5) return "#d97706";
  return "#dc2626";
}

function SourceBadge({ source }) {
  if (!source) return null;
  const isFuseki = source === "fuseki";
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
      background: isFuseki ? "#eff6ff" : "#f5f6fa",
      color: isFuseki ? "#2563eb" : "#6b7280",
      border: `1px solid ${isFuseki ? "#bfdbfe" : "#e0e0e0"}`,
    }}>
      {isFuseki ? "Fuseki" : "Django fallback"}
    </span>
  );
}

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchReport = useCallback(() => {
    setLoading(true);
    setErr("");
    fetch(`${API}/federation/report/`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
        setLastRefresh(new Date());
      })
      .catch(e => {
        setErr(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading)
    return <div style={{ padding: 40, textAlign: "center" }}><span className="spinner" /></div>;

  if (err)
    return <div style={{ color: "#dc2626", padding: 20 }}>Could not load federation report: {err}</div>;

  if (!data)
    return null;

  const { federationScore, totalCourses, totalConflicts, universities, conflicts, fusekiStatus } = data;

  return (
    <div className="admin-page">

      {/* Header row with refresh */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <div className="admin-title">Federation Overview</div>
          <div className="admin-subtitle">Quality assessment across all connected university knowledge graphs</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <button
            onClick={fetchReport}
            style={{
              fontSize: 12, padding: "6px 14px", borderRadius: 6, cursor: "pointer",
              background: "#2563eb", color: "#fff", border: "none", fontWeight: 500,
            }}
          >
            ↻ Refresh
          </button>
          {lastRefresh && (
            <span style={{ fontSize: 10, color: "#6b7280" }}>
              Last updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Fuseki status row */}
      {fusekiStatus && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {UNIS.map(uni => (
            <div key={uni} style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 11, color: "#6b7280",
              background: "#f5f6fa", border: "1px solid #e0e0e0",
              borderRadius: 6, padding: "4px 10px",
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: fusekiStatus[uni] ? "#16a34a" : "#d97706",
                display: "inline-block",
              }} />
              {uni}
              <span style={{ color: fusekiStatus[uni] ? "#16a34a" : "#d97706", fontWeight: 500 }}>
                {fusekiStatus[uni] ? "Fuseki online" : "Fallback"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="value color-black">{totalCourses}</div>
          <div className="label">Total courses in federation</div>
        </div>
        <div className="summary-card">
          <div className="value" style={{ color: totalConflicts > 0 ? "#dc2626" : "#16a34a" }}>{totalConflicts}</div>
          <div className="label">Cross-source conflicts found</div>
        </div>
        <div className="summary-card">
          <div className="value" style={{ color: scoreColor(federationScore) }}>
            {federationScore?.toFixed(2) ?? "—"}
          </div>
          <div className="label">Federation FAIR score</div>
        </div>
      </div>

      {/* Per university */}
      <div className="section">
        <div className="section-title">Quality per university</div>
        <div className="uni-grid">
          {UNIS.map(uni => {
            const q = universities[uni];
            if (!q) return null;

            if (q.overall === "NO DATA") {
              return (
                <div key={uni} className="uni-card">
                  <h4>{uni}</h4>
                  <div className="no-data">No submissions yet</div>
                </div>
              );
            }

            return (
              <div key={uni} className="uni-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <h4 style={{ margin: 0 }}>{uni}</h4>
                  <SourceBadge source={q.source} />
                </div>
                <div className="uni-row">
                  <span className="row-label">Result</span>
                  <span className={`badge ${q.overall === "PASS" ? "badge-pass" : "badge-fail"}`}>{q.overall}</span>
                </div>
                <div className="uni-row">
                  <span className="row-label">FAIR score</span>
                  <span className="row-val" style={{ color: scoreColor(q.fairScore) }}>{q.fairScore.toFixed(2)}</span>
                </div>
                <div className="uni-row">
                  <span className="row-label">Courses</span>
                  <span className="row-val">{q.totalCourses}</span>
                </div>
                <div className="uni-row">
                  <span className="row-label">SHACL violations</span>
                  <span className="row-val" style={{ color: q.shaclViolations > 0 ? "#dc2626" : "#16a34a" }}>{q.shaclViolations}</span>
                </div>
                <div className="uni-row">
                  <span className="row-label">SPARQL failed</span>
                  <span className="row-val" style={{ color: q.sparqlFailed > 0 ? "#dc2626" : "#16a34a" }}>{q.sparqlFailed}</span>
                </div>
                <div className="fair-bar">
                  <div className="fair-bar-fill" style={{ width: `${q.fairScore * 100}%`, background: scoreColor(q.fairScore) }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conflicts */}
      <div className="section">
        <div className="section-title">
          Cross-source conflicts &nbsp;
          <span className={`badge ${totalConflicts === 0 ? "badge-pass" : "badge-fail"}`}>
            {totalConflicts === 0 ? "None" : totalConflicts}
          </span>
        </div>

        {conflicts.length === 0 ? (
          <div className="no-conflicts">No conflicts detected between university sources.</div>
        ) : (
          conflicts.map((c, i) => (
            <div key={i} className="conflict-item">
              <div className="conflict-header">
                <span className={`conflict-type ${c.type === "schema_gap" ? "schema" : "ects"}`}>
                  {c.type === "ects_mismatch" ? "ECTS mismatch"
                    : c.type === "name_mismatch" ? "Name mismatch"
                    : "Schema gap"}
                </span>
                {c.courseCode && <span className="conflict-code">{c.courseCode}</span>}
                {c.university && <span className="conflict-uni">{c.university}</span>}
              </div>
              <div className="conflict-msg">{c.message}</div>
              {c.detail && (
                <div className="conflict-tags">
                  {Object.entries(c.detail).map(([k, v]) => (
                    <span key={k} className="conflict-tag">{k}: {String(v)}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}