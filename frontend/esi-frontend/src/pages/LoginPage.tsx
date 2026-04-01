import { useState } from "react";
import type { Page, ApiUser } from "../types";
import { loginUser } from "../api/index";
import type { ApiError } from "../api/index";
import "./Auth.css";

interface Props {
  onNavigate: (page: Page) => void;
  onLoginSuccess: (user: ApiUser, token: string) => void;  // Fix #2: no more any
}

const DEMO = [
  { role: "Parent", username: "testuser1",  password: "Str0ngPass!" },
  { role: "Tutor",  username: "testtutor1", password: "Str0ngPass!" },
];

export default function LoginPage({ onNavigate, onLoginSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const fillDemo = (d: (typeof DEMO)[0]) => {
    setUsername(d.username);
    setPassword(d.password);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!username.trim() || !password)
        return setError("Please enter your username and password.");
      
      setError("");
      setLoading(true);

      try {
        const data = await loginUser(username.trim(), password);
        
        const user = (data.user ?? data) as ApiUser;
        
        // We pass null or empty string for token since the browser handles it
        onLoginSuccess(user, ""); 
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message ?? "Invalid username or password.");
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="auth-page">
      <form className="auth-card fade-up" onSubmit={handleSubmit} noValidate>

        <div className="auth-icon">
          <i className="fas fa-sign-in-alt" />
        </div>
        <h2>Welcome Back</h2>
        <p>Sign in to your STEM Tutor Finder account</p>

        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {/* Demo accounts */}
        <div className="auth-demo-box">
          <div className="auth-demo-title">
            <i className="fas fa-bolt" /> Quick Demo Login
          </div>
          <div className="auth-demo-accounts">
            {DEMO.map((d) => (
              <div key={d.username} className="auth-demo-row" onClick={() => fillDemo(d)}>
                <span className={`demo-role-badge ${d.role}`}>{d.role}</span>
                <span style={{ fontWeight: 600, color: "var(--text)" }}>@{d.username}</span>
                <span className="demo-pw">{d.password}</span>
              </div>
            ))}
          </div>
          <div className="auth-demo-note">
            <i className="fas fa-info-circle" /> Click a row to autofill
          </div>
        </div>

        <div className="auth-divider">or sign in manually</div>

        <div className="auth-field">
          <label><i className="fas fa-at" /> Username *</label>
          <input
            type="text" required autoFocus
            placeholder="e.g. kofi_mensah"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="auth-field">
          <label><i className="fas fa-lock" /> Password *</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"} required
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{ paddingRight: "2.8rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              style={{
                position: "absolute", right: ".75rem", top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text3)", fontSize: ".9rem",
              }}
            >
              <i className={`fas fa-${showPw ? "eye-slash" : "eye"}`} />
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
          {loading
            ? <><i className="fas fa-spinner fa-spin" /> Signing in…</>
            : <><i className="fas fa-sign-in-alt" /> Sign In</>}
        </button>

        <p className="auth-switch">
          No account yet?{" "}
          <span onClick={() => onNavigate("register")}>Create a free account</span>
        </p>

      </form>
    </div>
  );
}