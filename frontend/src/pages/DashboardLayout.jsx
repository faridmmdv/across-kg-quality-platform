import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardHome from "./Dashboardhome.jsx";
import SubmitPage from "./SubmitPage.jsx";

const BG = "https://www.tu-chemnitz.de/tu/aktuelles/2022/1669623127_16_9.jpg";

const PAGES = {
  home:   { label: "Dashboard"   },
  submit: { label: "Submit Data" },
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState("home");

  function renderPage() {
    if (page === "home")   return <DashboardHome onNavigate={setPage} />;
    if (page === "submit") return <SubmitPage />;
    return null;
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "210px 1fr",
      height: "100vh",
      backgroundImage: `url(${BG})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>

      {/* Sidebar */}
      <aside style={{
        background: "rgba(255,255,255,0.88)",
        borderRight: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(6px)",
      }}>
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #e0e0e0" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>Across KG</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Quality Platform</div>
        </div>

        <nav style={{ padding: "8px 0", flex: 1 }}>
          {Object.entries(PAGES).map(([key, val]) => (
            <div
              key={key}
              onClick={() => setPage(key)}
              style={{
                padding: "9px 16px",
                fontSize: 13,
                cursor: "pointer",
                color: page === key ? "#2563eb" : "#374151",
                background: page === key ? "#eff6ff" : "transparent",
                borderRight: page === key ? "3px solid #2563eb" : "3px solid transparent",
                fontWeight: page === key ? 500 : 400,
                transition: ".12s",
              }}
            >
              {val.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #e0e0e0" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#1a1a2e" }}>{user.name}</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>{user.university ?? "Federation Admin"}</div>
          <button
            onClick={logout}
            style={{ fontSize: 12, color: "#6b7280", background: "none", border: "1px solid #e0e0e0", padding: "5px 12px", borderRadius: 4, cursor: "pointer", width: "100%" }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{
          background: "rgba(255,255,255,0.82)",
          borderBottom: "1px solid #e0e0e0",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(6px)",
        }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: "#1a1a2e" }}>{PAGES[page]?.label}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
            <span className="pulse-dot" /> Online
          </span>
        </header>

        <div style={{
          flex: 1,
          overflow: "auto",
          padding: 24,
          background: "rgba(245,246,250,0.75)",
          backdropFilter: "blur(3px)",
        }}>
          {renderPage()}
        </div>
      </div>

    </div>
  );
}