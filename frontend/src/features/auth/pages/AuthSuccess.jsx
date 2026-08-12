import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate("/", { replace: true });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [navigate]);

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
