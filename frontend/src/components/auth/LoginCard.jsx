import { useState } from "react";

export default function LoginCard({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    onLogin?.({
      email,
      universityName: "TU Chemnitz",
      role: "university_user",
    });
  }

  const isDisabled = !email || !password;

  return (
    <div style={styles.card}>
      <h1 style={styles.title}>Uni KG Quality Platform</h1>
      <p style={styles.subtitle}>Sign in to continue</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <div style={styles.error}>{error}</div>}

        <button
          type="submit"
          style={{
            ...styles.button,
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
          disabled={isDisabled}
        >
          Log In
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: {
    width: 380,
    padding: 32,
    borderRadius: 14,
    background: "#ffffff",
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
    textAlign: "center",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  },
  title: {
    margin: 0,
    marginBottom: 8,
    fontSize: 20,
    fontWeight: 700,
  },
  subtitle: {
    marginBottom: 24,
    color: "#6b7280",
    fontSize: 14,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
  },
  button: {
    padding: 12,
    borderRadius: 10,
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    transition: "0.2s ease",
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
    textAlign: "left",
  },
};
