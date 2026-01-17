"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from "react";
import { useRouter } from "next/navigation";
import api, { type User } from "./api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.auth
        .me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("token");
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem("token", res.accessToken);
    setUser(res.user);
    router.push("/");
  }, [router]);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const res = await api.auth.signup({ email, password, name });
    localStorage.setItem("token", res.accessToken);
    setUser(res.user);
    router.push("/");
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("workspaceId");
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
