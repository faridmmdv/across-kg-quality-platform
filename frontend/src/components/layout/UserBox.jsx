export default function UserBox({ user, onLogout }) {
  return (
    <div style={styles.box}>
      <div style={styles.line}>
        <strong>User:</strong> {user?.email}
      </div>
      <div style={styles.line}>
        <strong>University:</strong> {user?.universityName}
      </div>

      <button style={styles.btn} onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

const styles = {
  box: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    minWidth: 260,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    display: "grid",
    gap: 8,
  },
  line: { fontSize: 13, color: "#111827" },
  btn: {
    marginTop: 4,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
};
