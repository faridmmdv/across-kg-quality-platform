export default function QualityReportPanel({ report, onReset }) {
  const { overall, entity, summary, shacl, sparql, fair } = report;
  const isPass = overall === "PASS";

  return (
    <div style={{ maxWidth: 700 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
              {entity.courseCode} · {entity.courseName}
            </span>
            <span className={`badge ${isPass ? "badge-pass" : "badge-fail"}`}>
              {overall}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {entity.provider} · Instance #{entity.courseInstanceId}
          </div>
        </div>
        <button
          onClick={onReset}
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)", padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
        >
          ← New submission
        </button>
      </div>

      {/* FAIR Assessment */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)", letterSpacing: ".07em" }}>
            FAIR ASSESSMENT
          </div>
          <span className="badge badge-accent">{summary.fairOverallScore?.toFixed(2)}</span>
        </div>
        {fair.notes?.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {fair.notes.map((n, i) => (
              <div key={i} style={{ fontSize: 11, color: "var(--muted)" }}>· {n}</div>
            ))}
          </div>
        )}
      </div>

      {/* SHACL violations */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)", letterSpacing: ".07em" }}>
            SHACL VALIDATION
          </div>
          <span className={`badge ${shacl.conforms ? "badge-pass" : "badge-fail"}`}>
            {shacl.conforms ? "Conforms" : `${summary.shaclViolationCount} violation${summary.shaclViolationCount !== 1 ? "s" : ""}`}
          </span>
        </div>
        {shacl.violations?.length === 0 ? (
          <div style={{ fontSize: 12, color: "#4ade80" }}>No violations found</div>
        ) : (
          shacl.violations?.map((v, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{
                fontSize: 9, padding: "2px 6px", borderRadius: 3,
                fontFamily: "var(--mono)", whiteSpace: "nowrap", marginTop: 2,
                background: v.severity?.toLowerCase().includes("warn") ? "var(--yellow-dim)" : "var(--red-dim)",
                color: v.severity?.toLowerCase().includes("warn") ? "#fbbf24" : "#f87171"
              }}>
                {v.severity?.includes("Warning") ? "WARN" : "ERROR"}
              </span>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, flex: 1 }}>
                <div>{v.message || "Constraint violated"}</div>
                {v.resultPath && (
                  <div style={{ fontSize: 10, color: "var(--faint)", marginTop: 2, fontFamily: "var(--mono)" }}>
                    {v.resultPath}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* SPARQL tests */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)", letterSpacing: ".07em" }}>
            SPARQL TESTS
          </div>
          <span className={`badge ${summary.sparqlFailedCount === 0 ? "badge-pass" : "badge-fail"}`}>
            {sparql.passed}/{sparql.passed + sparql.failed} passed
          </span>
        </div>
        {sparql.results?.map((r, i, arr) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "#a5b4fc", fontFamily: "var(--mono)", minWidth: 44 }}>{r.id}</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.title}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={`badge ${r.severity === "WARNING" ? "badge-warn" : "badge-info"}`}>{r.dimension}</span>
              <span style={{ fontSize: 14, color: r.passed ? "#4ade80" : "#f87171" }}>{r.passed ? "✓" : "✗"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>SHACL</div>
          <span className={`badge ${summary.shaclConforms ? "badge-pass" : "badge-fail"}`}>
            {summary.shaclConforms ? "Conforms" : "Violations found"}
          </span>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>FAIR score</div>
          <span className="badge badge-accent">{summary.fairOverallScore?.toFixed(2)}</span>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>SPARQL</div>
          <span className={`badge ${summary.sparqlFailedCount === 0 ? "badge-pass" : "badge-fail"}`}>
            {summary.sparqlFailedCount === 0 ? "All passed" : `${summary.sparqlFailedCount} failed`}
          </span>
        </div>
      </div>

    </div>
  );
}
