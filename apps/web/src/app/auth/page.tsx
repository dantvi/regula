"use client";

import { useState, useEffect, useCallback } from "react";

const API = "/api";

type User = { id: string; email: string; preferred_language: string } | null;

export default function AuthPage() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"register" | "login">("login");

  const fetchMe = useCallback(async () => {
    const res = await fetch(`${API}/auth/me`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchMe().finally(() => setLoading(false));
  }, [fetchMe]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const path = action === "register" ? "register" : "login";
    const res = await fetch(`${API}/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error?.code || String(res.status));
      return;
    }
    setUser(data);
    setPassword("");
  }

  async function handleLogout() {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;

  return (
    <div
      style={{
        padding: 16,
        fontFamily: "system-ui, sans-serif",
        maxWidth: 400,
      }}
    >
      <h1>Auth</h1>
      {user ? (
        <div>
          <p>Signed in: {user.email}</p>
          <p>Language: {user.preferred_language}</p>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 8 }}>
            <label>
              Email{" "}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>
              Password{" "}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={action === "register" ? 8 : 1}
              />
            </label>
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <div style={{ gap: 8, display: "flex" }}>
            <button type="submit">
              {action === "login" ? "Login" : "Register"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAction(action === "login" ? "register" : "login");
                setError(null);
              }}
            >
              Switch to {action === "login" ? "Register" : "Login"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
