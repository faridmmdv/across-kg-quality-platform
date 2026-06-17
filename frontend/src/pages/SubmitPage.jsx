import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import QualityReportPanel from "../components/quality/QualityReportPanel.jsx";
import "./SubmitPage.css";

const API = "http://127.0.0.1:8000/api";

const UNIS = ["TU Chemnitz", "University of Girona", "University of Udine"];

const EMPTY = {
  providerName: "",
  courseCode: "", courseName: "", description: "", ectsCredits: "",
  startDate: "", endDate: "", term: "", maximumEnrollment: "",
  instructorName: "", instructorEmail: "", locationName: ""
};

function fairColor(score) {
  if (score >= 0.7) return "#16a34a";
  if (score >= 0.5) return "#d97706";
  return "#dc2626";
}

function CourseForm({ form, onChange, index, total }) {
  function set(k, v) { onChange({ ...form, [k]: v }); }
  return (
    <div className="form-card">
      {total > 1 && <div className="course-index">Course {index + 1} of {total}</div>}

      <div className="form-row-1">
        <label className="form-label">University *</label>
        <select className="form-input" value={form.providerName} onChange={e => set("providerName", e.target.value)}>
          <option value="">Select university...</option>
          {UNIS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <div className="form-section-title">Course details</div>
      <div className="form-row-2">
        <div><label className="form-label">Course code *</label><input className="form-input" value={form.courseCode} onChange={e => set("courseCode", e.target.value)} placeholder="WE301" /></div>
        <div><label className="form-label">ECTS credits *</label><input className="form-input" type="number" value={form.ectsCredits} onChange={e => set("ectsCredits", e.target.value)} placeholder="5" /></div>
      </div>
      <div className="form-row-1"><label className="form-label">Course name *</label><input className="form-input" value={form.courseName} onChange={e => set("courseName", e.target.value)} placeholder="Web Engineering" /></div>
      <div className="form-row-1"><label className="form-label">Description</label><textarea className="form-input form-textarea" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Short description..." /></div>

      <div className="form-section-title">Offering</div>
      <div className="form-row-2">
        <div><label className="form-label">Start date *</label><input className="form-input" type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} /></div>
        <div><label className="form-label">End date *</label><input className="form-input" type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} /></div>
      </div>
      <div className="form-row-2">
        <div><label className="form-label">Term</label><input className="form-input" value={form.term} onChange={e => set("term", e.target.value)} placeholder="WS 2025/26" /></div>
        <div><label className="form-label">Max enrollment</label><input className="form-input" type="number" value={form.maximumEnrollment} onChange={e => set("maximumEnrollment", e.target.value)} placeholder="60" /></div>
      </div>
      <div className="form-row-1"><label className="form-label">Location</label><input className="form-input" value={form.locationName} onChange={e => set("locationName", e.target.value)} placeholder="Room A-101" /></div>

      <div className="form-section-title">Instructor</div>
      <div className="form-row-2">
        <div><label className="form-label">Name *</label><input className="form-input" value={form.instructorName} onChange={e => set("instructorName", e.target.value)} placeholder="Prof. ......" /></div>
        <div><label className="form-label">Email</label><input className="form-input" type="email" value={form.instructorEmail} onChange={e => set("instructorEmail", e.target.value)} placeholder="prof@edu.de" /></div>
      </div>
    </div>
  );
}

function MiniQualityReport({ report }) {
  const { fair, shacl, sparql, summary } = report;
  const fairDims = [
    { key: "F", label: "Findable",      score: fair.F_score ?? 0 },
    { key: "A", label: "Accessible",    score: fair.A_score ?? 0 },
    { key: "I", label: "Interoperable", score: fair.I_score ?? 0 },
    { key: "R", label: "Reusable",      score: fair.R_score ?? 0 },
  ];

  return (
    <div className="course-result-body">

      <div className="mini-section-title">FAIR scores</div>
      <div className="fair-grid">
        {fairDims.map(d => (
          <div key={d.key} className="fair-item">
            <div className="fair-letter">{d.key}</div>
            <div className="fair-score">{d.score.toFixed(1)}</div>
            <div className="fair-label">{d.label}</div>
            <div className="fair-bar">
              <div className="fair-bar-fill" style={{ width: `${d.score * 100}%`, background: fairColor(d.score) }} />
            </div>
          </div>
        ))}
      </div>

      {fair.notes?.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {fair.notes.map((n, i) => (
            <div key={i} style={{ fontSize: 11, color: "#6b7280", padding: "2px 0" }}>· {n}</div>
          ))}
        </div>
      )}

      <div className="mini-section-title">
        SHACL validation
        {shacl.conforms
          ? <span className="badge badge-pass" style={{ marginLeft: 8 }}>Conforms</span>
          : <span className="badge badge-fail" style={{ marginLeft: 8 }}>{summary.shaclViolationCount} violation{summary.shaclViolationCount !== 1 ? "s" : ""}</span>
        }
      </div>
      {shacl.violations?.length === 0
        ? <div className="no-violations">No violations found</div>
        : shacl.violations?.map((v, i) => (
            <div key={i} className="violation-row">
              <span className={`violation-sev ${v.severity?.includes("Warning") ? "sev-warn" : "sev-error"}`}>
                {v.severity?.includes("Warning") ? "WARN" : "ERROR"}
              </span>
              <div className="violation-msg">{v.message || "Constraint violated"}</div>
            </div>
          ))
      }

      <div className="mini-section-title">
        SPARQL tests
        <span className={`badge ${summary.sparqlFailedCount === 0 ? "badge-pass" : "badge-fail"}`} style={{ marginLeft: 8 }}>
          {sparql.passed}/{sparql.passed + sparql.failed} passed
        </span>
      </div>
      {sparql.results?.map(r => (
        <div key={r.id} className="sparql-row">
          <span className="sparql-id">{r.id}</span>
          <span className="sparql-title">{r.title}</span>
          <span className={r.passed ? "sparql-pass" : "sparql-fail"}>{r.passed ? "✓" : "✗"}</span>
        </div>
      ))}
    </div>
  );
}

function CourseResultCard({ result }) {
  const [open, setOpen] = useState(false);
  const { courseCode, courseName, overall, fairScore, report, error } = result;

  return (
    <div className="course-result">
      <div className="course-result-header" onClick={() => setOpen(o => !o)}>
        <div className="course-result-left">
          <span className="course-result-code">{courseCode || "—"}</span>
          <span className="course-result-name">{courseName || "Unknown"}</span>
        </div>
        <div className="course-result-right">
          <span className="course-result-fair">FAIR: {fairScore?.toFixed(2) ?? "—"}</span>
          <span className={`badge ${overall === "PASS" ? "badge-pass" : overall === "ERROR" ? "badge-warn" : "badge-fail"}`}>{overall}</span>
          <span className="expand-arrow">{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && report && <MiniQualityReport report={report} />}
      {open && !report && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid #f0f0f0" }}>
          <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 6, fontWeight: 500 }}>
            Submission failed — could not process this row
          </div>
          {error && (
            <div style={{ fontSize: 11, color: "#6b7280", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, padding: "6px 10px" }}>
              {typeof error === "string" ? error : JSON.stringify(error)}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>
            Common causes: missing required fields, invalid date format, or network error.
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubmitPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("form");
  const [form, setForm] = useState({
    ...EMPTY,
    providerName: user.university ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [err, setErr] = useState("");
  const [csvForms, setCsvForms] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvSubmitting, setCsvSubmitting] = useState(false);
  const [csvResults, setCsvResults] = useState([]);
  const fileRef = useRef();

  function parseCSVLine(line) {
    const fields = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
        else { inQuotes = !inQuotes; }
      } else if (ch === "," && !inQuotes) {
        fields.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    fields.push(cur.trim());
    return fields;
  }

  function parseCSV(text) {
    const lines = text.trim().split("\n").map(l => l.replace(/\r$/, ""));
    const headers = parseCSVLine(lines[0]);
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const values = parseCSVLine(line);
      const row = {};
      headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
      return {
        providerName: row.providerName || user.university || "",
        courseCode: row.courseCode || "", courseName: row.courseName || "",
        description: row.description || "", ectsCredits: row.ectsCredits || "",
        startDate: row.startDate || "", endDate: row.endDate || "",
        term: row.term || "", maximumEnrollment: row.maximumEnrollment || "",
        instructorName: row.instructorName || "", instructorEmail: row.instructorEmail || "",
        locationName: row.locationName || "",
      };
    });
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCsvLoading(true); setCsvResults([]);
    const reader = new FileReader();
    reader.onload = ev => { setCsvForms(parseCSV(ev.target.result)); setCsvLoading(false); };
    reader.readAsText(file);
  }

  async function submitOne(f) {
    const payload = {
      providerName: f.providerName || user.university || "TU Chemnitz",
      course: { courseCode: f.courseCode, name: f.courseName, description: f.description, ectsCredits: Number(f.ectsCredits) },
      courseInstance: {
        startDate: f.startDate, endDate: f.endDate,
        term: f.term || null,
        maximumEnrollment: f.maximumEnrollment ? Number(f.maximumEnrollment) : null,
        instructor: { name: f.instructorName, email: f.instructorEmail || null },
        location: f.locationName ? { name: f.locationName } : null,
      },
    };
    const r1 = await fetch(`${API}/submissions/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!r1.ok) throw new Error(await r1.text());
    const created = await r1.json();
    const r2 = await fetch(`${API}/submissions/${created.id}/run-quality/`, { method: "POST" });
    if (!r2.ok) throw new Error("Quality engine failed");
    return await r2.json();
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!form.providerName) { setErr("Please select a university."); return; }
    setLoading(true); setErr(""); setReport(null);
    try { setReport(await submitOne(form)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  async function handleSubmitAll() {
    setCsvSubmitting(true);
    const results = [];
    for (const f of csvForms) {
      try {
        const r = await submitOne(f);
        results.push({ courseCode: f.courseCode, courseName: f.courseName, overall: r.overall, fairScore: r.summary.fairOverallScore, report: r });
      } catch (e) {
        results.push({ courseCode: f.courseCode, courseName: f.courseName, overall: "ERROR", report: null, error: e.message });
      }
    }
    setCsvResults(results);
    setCsvSubmitting(false);
  }

  function clearCsv() {
    setCsvForms([]); setCsvResults([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (report) {
    return <QualityReportPanel report={report} onReset={() => { setReport(null); setForm({ ...EMPTY, providerName: user.university ?? "" }); }} />;
  }

  return (
    <div className="submit-page">
      <div className="tab-bar">
        {["form", "csv"].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "form" ? "Manual form" : "CSV upload"}
          </button>
        ))}
      </div>

      {tab === "form" && (
        <form onSubmit={handleFormSubmit}>
          <CourseForm form={form} onChange={setForm} index={0} total={1} />
          {err && <div className="error-msg">{err}</div>}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <><span className="spinner" /> Running quality check...</> : "Submit and run quality check"}
          </button>
        </form>
      )}

      {tab === "csv" && (
        <div>
          {csvForms.length === 0 && !csvLoading && (
            <div className="csv-upload-area">
              <div className="csv-upload-title">Upload a CSV file</div>
              <div className="csv-upload-hint">courseCode, courseName, ectsCredits, startDate, endDate, instructorName, providerName</div>
              <input type="file" accept=".csv" onChange={handleFileChange} ref={fileRef} style={{ display: "none" }} id="csvInput" />
              <label htmlFor="csvInput" className="csv-choose-btn">Choose CSV file</label>
            </div>
          )}

          {csvLoading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

          {csvForms.length > 0 && csvResults.length === 0 && (
            <div>
              <div className="csv-header">
                <div className="csv-header-title">{csvForms.length} course{csvForms.length > 1 ? "s" : ""} ready</div>
                <div className="csv-header-actions">
                  <button className="btn-clear" onClick={clearCsv}>Clear</button>
                  <button className="btn-submit-all" onClick={handleSubmitAll} disabled={csvSubmitting}>
                    {csvSubmitting ? <><span className="spinner" /> Submitting...</> : "Submit all"}
                  </button>
                </div>
              </div>
              {csvForms.map((f, i) => (
                <CourseForm key={i} form={f} onChange={u => setCsvForms(p => p.map((x, j) => j === i ? u : x))} index={i} total={csvForms.length} />
              ))}
              <button className="submit-btn" onClick={handleSubmitAll} disabled={csvSubmitting}>
                {csvSubmitting ? <><span className="spinner" /> Submitting...</> : `Submit all ${csvForms.length} courses`}
              </button>
            </div>
          )}

          {csvResults.length > 0 && (
            <div>
              <div className="csv-header">
                <div className="csv-header-title">Results — {csvResults.length} courses submitted</div>
                <button className="btn-clear" onClick={clearCsv}>Upload another</button>
              </div>

              <div className="results-summary">
                <div className="result-stat"><div className="val" style={{ color: "#1a1a2e" }}>{csvResults.length}</div><div className="lbl">Total</div></div>
                <div className="result-stat"><div className="val" style={{ color: "#16a34a" }}>{csvResults.filter(r => r.overall === "PASS").length}</div><div className="lbl">Passed</div></div>
                <div className="result-stat"><div className="val" style={{ color: "#dc2626" }}>{csvResults.filter(r => r.overall !== "PASS").length}</div><div className="lbl">Failed</div></div>
              </div>

              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                Click any course to see the full quality report
              </div>

              {csvResults.map((r, i) => (
                <CourseResultCard key={i} result={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}