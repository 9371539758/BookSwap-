import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/register.scss";

// ─── REGISTER PAGE ────────────────────────────────────────────────────────────
// Allows user to create a new account with:
//  - username (unique handle), fullName (display name), email, password
//  - Optional: phone, location (city — for future book swap matching by area)
// On success → navigate to / (landing page)

const Register = () => {
  const { loading, handleRegister, handleGoogleLogin } = useAuth();
  const navigate = useNavigate();

  // Form field state
  const [form, setForm] = useState({
    username: "",   // unique handle e.g. sujit123
    fullName: "",   // display name e.g. Sujit Kumar
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    location: "",   // city/area — used for book swap location matching
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Generic onChange — updates any field by name
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ─── SUBMIT HANDLER ──────────────────────────────────────────────────────────
  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validations
    if (!form.username || !form.email || !form.password) {
      setError("Username, email, and password are required");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await handleRegister({
        username: form.username,
        fullName: form.fullName || form.username, // fallback to username if no full name
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        location: form.location ? { city: form.location } : undefined,
      });
      navigate("/"); // success → landing page
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Registration failed";
      setError(msg);
    }
  };

  return (
    <div className="auth-page">
      {/* Left decorative panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          {/* <div className="auth-brand-logo">📚</div> */}
          <h2 className="auth-brand-title">BookSwap</h2>
          <p className="auth-brand-tagline">Join thousands of readers today</p>
          <div className="auth-brand-features">
            <div className="feature-item">✓ List your books for free</div>
            <div className="feature-item">✓ Connect with local readers</div>
            <div className="feature-item">✓ Exchange or sell your books</div>
            <div className="feature-item">✓ Discover rare titles</div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel">
        <div className="auth-form-inner">
          <h1 className="auth-heading">Create account</h1>
          <p className="auth-subtext">Start your reading journey today</p>

          {/* Error display */}
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

          <div className="auth-divider">
            <span>or create with email</span>
          </div>

          {/* ── Registration Form ── */}
          <form onSubmit={submitHandler}>
            {/* Row 1: username + fullName side by side */}
            <div className="field-row">
              <div className="field">
                <label htmlFor="username">Username *</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="sujit123"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                />
              </div>
              <div className="field">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Sujit Kumar"
                  value={form.fullName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            {/* Row 2: phone + location side by side */}
            <div className="field-row">
              <div className="field">
                <label htmlFor="phone">Phone <span className="optional">(optional)</span></label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="location">City <span className="optional">(optional)</span></label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="Mumbai"
                  value={form.location}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password *</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁‍🗨" : "👁"}
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" /> Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Sign in here</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;