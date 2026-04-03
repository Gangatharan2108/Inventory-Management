import { createContext, useEffect, useState } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  // ── Initial state from localStorage ──────────────────
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // ── Sync user → localStorage ──────────────────────────
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem("auth_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("auth_user");
      }
    } catch (e) {
      console.error("localStorage write error", e);
    }
  }, [user]);

  // ── Fetch fresh permissions from backend ──────────────
  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await api.get("/auth/me/");
      setUser(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setUser(null);
      }
    }
  };

  // ── Refresh on window focus ───────────────────────────
  // Owner permission save பண்ணிட்டு user tab-க்கு திரும்பும்போது
  // automatically fresh permissions fetch ஆகும்
  useEffect(() => {
    if (!user) return;

    const onFocus = () => refreshUser();
    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, [user?.id]);   // user id மாறும்போது மட்டும் re-register

  // ── Logout helper ─────────────────────────────────────
  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};