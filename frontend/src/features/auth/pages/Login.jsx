import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/login.scss";

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
// Allows user to sign in with email/username + password OR Google OAuth.
// On success → navigate to / (landing page with navbar)
// If already logged in → AuthLayout redirects to / automatically

const Login = () => {
  const { loading, handleLogin, handleGoogleLogin } = useAuth();
  const [identifier, setIdentifier] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ─── SUBMIT HANDLER ──────────────────────────────────────────────────────────
  const submitHandler = async (e) => {
    e.preventDefault();
    setError(""); // clear previous errors

    if (!identifier || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      await handleLogin({ identifier, password });
      navigate("/"); // success → go to landing page
    } catch (err) {
      // Show the error message from backend (e.g., "Invalid credentials")
      const msg = err.response?.data?.message || err.message || "Login failed";
      setError(msg);
    }
  };

  return (
    <div className="auth-page">
      {/* Left decorative panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">📚</div>
          <h2 className="auth-brand-title">BookSwap</h2>
          <p className="auth-brand-tagline">Discover. Exchange. Repeat.</p>
          <div className="auth-brand-stats">
            <div className="stat">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Books Listed</span>
            </div>
            <div className="stat">
              <span className="stat-number">5K+</span>
              <span className="stat-label">Happy Readers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel">
        <div className="auth-form-inner">
          <h1 className="auth-heading">Welcome back</h1>
          <p className="auth-subtext">Sign in to your account to continue</p>

          {/* Error message display */}
          {error && (
            <div className="auth-error">
              <span>⚠</span> {error}
            </div>
          )}

          {/* ── Google OAuth Button ── */}
          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.6 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.6 35.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.4 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          {/* ── Login Form ── */}
          <form onSubmit={submitHandler}>
            <div className="field">
              <label htmlFor="identifier">Email or Username</label>
              <input
                id="identifier"
                type="text"
                placeholder="you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                {/* Toggle password visibility */}
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁‍🗨" : "👁"}
                </button>
              </div>
            </div>

            <div className="auth-row">
              <span className="forgot" onClick={() => alert("Forgot password coming soon!")}>
                Forgot password?
              </span>
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" /> Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account?{" "}
            <span onClick={() => navigate("/register")}>Create one here</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
