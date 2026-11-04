import React, { useState } from "react";
import Icon from "./Icon";
import { api } from "../lib/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.login({ username: username.trim(), password });
      onLogin();
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">CP</span>
          <div>
            <strong>CricPulse</strong>
            <small>TOURNAMENT CONTROL</small>
          </div>
        </div>
        <span className="auth-kicker">ADMIN ACCESS</span>
        <h1>Welcome back.</h1>
        <p className="auth-copy">Sign in to manage teams, fixtures and match results.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="admin-username">Username</label>
            <input
              className="input"
              id="admin-username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="admin-password">Password</label>
            <input
              className="input"
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <button className="btn btn-dark btn-full auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in to CricPulse"}
            <Icon name="arrow" size={14} />
          </button>
        </form>
        <p className="auth-footnote">Administrator credentials are configured by the deployment owner.</p>
      </section>
    </main>
  );
}
