"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = async () => {
    try {
      const data = await authService.getProfile();
      if (data.success && data.user) {
        setUser(data.user);
        return data.user;
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Protect client-side page routing
  useEffect(() => {
    if (loading) return;

    const isLoginPage = pathname === "/login";

    if (!user) {
      // Redirect unauthenticated user to login page
      if (!isLoginPage) {
        router.push("/login");
      }
    } else {
      // Redirect logged-in user away from login page or root path to their dashboard
      if (isLoginPage || pathname === "/") {
        router.push("/dashboard");
      }
    }
  }, [user, loading, pathname]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      if (data.success) {
        // Fetch profile details immediately after successful login
        const profile = await fetchProfile();
        if (profile) {
          router.push("/dashboard");
        }
      }
      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setLoading(false);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkSession: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
