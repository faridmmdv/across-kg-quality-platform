import CourseInstanceForm from "../components/forms/CourseInstanceForm.jsx";
import UserBox from "../components/layout/UserBox.jsx";

export default function DashboardPage({ user, onLogout }) {
  return (
    <div style={styles.page}>
      <div style={styles.center}>
        <CourseInstanceForm />
      </div>

      <div style={styles.bottomLeft}>
        <UserBox user={user} onLogout={onLogout} />
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    display: "grid",
    placeItems: "center",
    padding: 16,
    position: "relative",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  center: {
    width: "100%",
    maxWidth: 720,
  },
  bottomLeft: {
    position: "fixed",
    left: 16,
    bottom: 16,
  },
};
