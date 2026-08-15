import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AuthSuccess = () => {
  const navigate = useNavigate();
  const { initialized, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!initialized) return;
    navigate(isAuthenticated ? "/" : "/login?error=google_auth_failed", { replace: true });
  }, [initialized, isAuthenticated, navigate]);

  return (
    <div className="auth-success" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f0f", color: "#fff" }}>
      <div style={{ textAlign: "center", maxWidth: 480, padding: 24 }}>
        <h1>Authentication successful</h1>
        <p>You will be redirected to your dashboard shortly.</p>
      </div>
    </div>
  );
};

export default AuthSuccess;
