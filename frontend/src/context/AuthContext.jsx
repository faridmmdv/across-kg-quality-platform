import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const USERS = [
  { id: 1, email: "admin@across.eu",password: "admin123",  role: "admin",    name: "Federation Admin",    university: null },
  { id: 2, email: "staff@tu-chemnitz.de", password: "staff123",  role: "uni_staff", name: "TU Chemnitz Staff",  university: "TU Chemnitz" },
  { id: 3, email: "staff@udg.edu", password: "staff123",  role: "uni_staff", name: "University of Girona Staff",  university: "University of Girona" },
  { id: 4, email: "staff@uniud.it", password: "staff123",  role: "uni_staff", name: "University of Udine Staff",   university: "University of Udine" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  function login(email, password) {
    const found = USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...safe } = found;
      setUser(safe);
      setError("");
      return true;
    }
    setError("Invalid email or password.");
    return false;
  }

  function logout() {
    setUser(null);
    setError("");
  }

  return (
    <AuthContext.Provider value={{ user, error, login, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}