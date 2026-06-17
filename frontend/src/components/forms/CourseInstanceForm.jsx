import { useState } from "react";

export default function CourseInstanceForm() {
  const [form, setForm] = useState({
    courseCode: "",
    name: "",
    description: "",
    ectsCredits: "",
    startDate: "",
    endDate: "",
    term: "",
    maximumEnrollment: "",
    instructorName: "",
    instructorEmail: "",
    locationName: "",
  });

  const [status, setStatus] = useState({
    state: "idle",
    message: "",
    details: null,
  });

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    setStatus({
      state: "loading",
      message: "Submitting to backend and running checks...",
      details: null,
    });

    const payload = {
      providerName: "TU Chemnitz",
      course: {
        courseCode: form.courseCode,
        name: form.name,
        description: form.description,
        ectsCredits: Number(form.ectsCredits),
      },
      courseInstance: {
        startDate: form.startDate,
        endDate: form.endDate,
        term: form.term || null,
        maximumEnrollment: form.maximumEnrollment
          ? Number(form.maximumEnrollment)
          : null,
        instructor: {
          name: form.instructorName,
          email: form.instructorEmail || null,
        },
        location: form.locationName ? { name: form.locationName } : null,
      },
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/submissions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        console.log("BACKEND ERROR:", err);
        setStatus({
          state: "error",
          message: "Backend rejected the data. Check console for details.",
          details: err,
        });
        return;
      }

      const data = await res.json();
      console.log("CREATED:", data);

      setStatus({
        state: "success",
        message: `Saved to DB successfully. CourseInstance id=${data.id}`,
        details: data,
      });
    } catch (error) {
      console.log("NETWORK ERROR:", error);
      setStatus({
        state: "error",
        message:
          "Could not reach backend. Is Django running on http://127.0.0.1:8000 ?",
        details: String(error),
      });
    }
  }

  function closeModal() {
    setStatus({ state: "idle", message: "", details: null });
  }

  return (
    <>
      {/* Modal for status */}
      {status.state !== "idle" && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>
              {status.state === "loading"
                ? "Running quality assessment..."
                : status.state === "success"
                ? "Submission Successful"
                : "Submission Failed"}
            </h3>

            <p style={{ color: "#374151" }}>{status.message}</p>

            {status.state === "loading" && (
              <div style={styles.spinnerRow}>
                <div style={styles.spinner} />
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  Please wait...
                </span>
              </div>
            )}

            {status.details && (
              <pre style={styles.pre}>
{JSON.stringify(status.details, null, 2)}
              </pre>
            )}

            <button style={styles.modalButton} onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div style={styles.card}>
        <h2 style={styles.title}>Course + CourseInstance Submission</h2>
        <p style={styles.subtitle}>
          This form will submit to Django backend. Later it will also return
          SHACL violations + metrics.
        </p>

        <form onSubmit={onSubmit} style={styles.form}>
          <Section title="Course (schema:Course)">
            <Row>
              <Field label="Course Code *">
                <input
                  style={styles.input}
                  value={form.courseCode}
                  onChange={(e) => setField("courseCode", e.target.value)}
                  placeholder="WE-301"
                  required
                />
              </Field>

              <Field label="ECTS Credits *">
                <input
                  style={styles.input}
                  type="number"
                  value={form.ectsCredits}
                  onChange={(e) => setField("ectsCredits", e.target.value)}
                  placeholder="5"
                  min="1"
                  max="30"
                  required
                />
              </Field>
            </Row>

            <Field label="Course Name *">
              <input
                style={styles.input}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Web Engineering"
                required
              />
            </Field>

            <Field label="Description">
              <textarea
                style={{ ...styles.input, minHeight: 90, resize: "vertical" }}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Short description..."
              />
            </Field>
          </Section>

          <Section title="Offering (schema:CourseInstance)">
            <Row>
              <Field label="Start Date *">
                <input
                  style={styles.input}
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  required
                />
              </Field>

              <Field label="End Date *">
                <input
                  style={styles.input}
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                  required
                />
              </Field>
            </Row>

            <Row>
              <Field label="Term (optional)">
                <input
                  style={styles.input}
                  value={form.term}
                  onChange={(e) => setField("term", e.target.value)}
                  placeholder="WS 2026/27"
                />
              </Field>

              <Field label="Maximum Enrollment (optional)">
                <input
                  style={styles.input}
                  type="number"
                  value={form.maximumEnrollment}
                  onChange={(e) =>
                    setField("maximumEnrollment", e.target.value)
                  }
                  placeholder="60"
                  min="1"
                />
              </Field>
            </Row>

            <Field label="Location Name (schema:Place, optional)">
              <input
                style={styles.input}
                value={form.locationName}
                onChange={(e) => setField("locationName", e.target.value)}
                placeholder="Room A123"
              />
            </Field>
          </Section>

          <Section title="Instructor (schema:Person)">
            <Row>
              <Field label="Instructor Name *">
                <input
                  style={styles.input}
                  value={form.instructorName}
                  onChange={(e) => setField("instructorName", e.target.value)}
                  placeholder="Prof. Dr. ..."
                  required
                />
              </Field>

              <Field label="Instructor Email (optional)">
                <input
                  style={styles.input}
                  type="email"
                  value={form.instructorEmail}
                  onChange={(e) => setField("instructorEmail", e.target.value)}
                  placeholder="name@uni.de"
                />
              </Field>
            </Row>
          </Section>

          <button style={styles.button} type="submit">
            Submit to Backend
          </button>
        </form>
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  );
}

function Row({ children }) {
  return <div style={styles.row}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <label style={styles.label}>
      <span style={styles.labelText}>{label}</span>
      {children}
    </label>
  );
}

const styles = {
  card: {
    width: "100%",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  title: { margin: 0, fontSize: 18 },
  subtitle: { marginTop: 6, marginBottom: 16, color: "#6b7280", fontSize: 13 },

  form: { display: "grid", gap: 14 },

  section: {
    border: "1px solid #eef2f7",
    borderRadius: 12,
    padding: 12,
    background: "#fafafa",
  },
  sectionTitle: { fontWeight: 800, fontSize: 13, marginBottom: 10 },
  sectionBody: { display: "grid", gap: 10 },

  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },

  label: { display: "grid", gap: 6 },
  labelText: { fontSize: 12, fontWeight: 700, color: "#111827" },

  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
    background: "#fff",
  },

  button: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  // Modal styles
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    zIndex: 999,
  },
  modal: {
    width: "100%",
    maxWidth: 720,
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: 16,
    boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
  },
  pre: {
    background: "#0b1220",
    color: "#e8eefc",
    padding: 12,
    borderRadius: 10,
    overflow: "auto",
    maxHeight: 260,
    fontSize: 12,
  },
  modalButton: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
  spinnerRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginTop: 8,
  },
  spinner: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "3px solid #e5e7eb",
    borderTop: "3px solid #2563eb",
    animation: "spin 1s linear infinite",
  },
};
