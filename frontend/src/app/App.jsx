import { AuthProvider, useAuth } from "../context/AuthContext.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import DashboardLayout from "../pages/DashboardLayout.jsx";

function Inner() {
  const { user } = useAuth();
  return user ? <DashboardLayout /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  );
}