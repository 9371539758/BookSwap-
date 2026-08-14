import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, googleLogin } from "../services/auth.api";

// ─── useAuth HOOK ─────────────────────────────────────────────────────────────
// Custom hook — gives any component easy access to auth state + actions.
// Usage: const { user, handleLogin, handleLogout } = useAuth();

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  const { user, loading, initialized, isAuthenticated, dispatch } = context;

  // ─── REGISTER ───────────────────────────────────────────────────────────────
  // Creates a new account. On success → stores user in state + sessionStorage.
  async function handleRegister({
    username,
    fullName,
    email,
    password,
    phone,
    location,
  }) {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await register({
        username,
        fullName,
        email,
        password,
        phone,
        location,
      });
      if (data?.token) {
        try {
          localStorage.setItem("bookswap_token", data.token);
          sessionStorage.setItem("bookswap_token", data.token);
        } catch {
          // ignore storage issues
        }
      }
      dispatch({ type: "SET_USER", payload: data.user });
      return data;
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false });
      throw error;
    }
  }

  // ─── LOGIN ──────────────────────────────────────────────────────────────────
  // Authenticates user with email/username + password.
  // On success → stores user in state + sessionStorage cache.
  async function handleLogin({ identifier, password }) {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await login({ identifier, password });
      if (data?.token) {
        try {
          localStorage.setItem("bookswap_token", data.token);
          sessionStorage.setItem("bookswap_token", data.token);
        } catch {
          // ignore storage issues
        }
      }
      dispatch({ type: "SET_USER", payload: data.user });
      return data;
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false });
      throw error;
    }
  }

  // ─── LOGOUT ─────────────────────────────────────────────────────────────────
  // Clears JWT cookie on server + wipes sessionStorage cache.
  async function handleLogout() {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await logout();
    } catch {
      // Even if server call fails, we clear local state (defensive)
    } finally {
      // Dispatch CLEAR_USER → reducer removes from sessionStorage + sets user=null
      dispatch({ type: "CLEAR_USER" });
    }
  }

  // ─── GOOGLE LOGIN ────────────────────────────────────────────────────────────
  // Redirects browser to Google OAuth page.
  // After Google auth, backend redirects back to /auth/success with JWT.
  function handleGoogleLogin() {
    googleLogin(); // triggers window.location.href redirect
  }

  return {
    user,
    loading,
    initialized,
    isAuthenticated,
    handleRegister,
    handleLogin,
    handleLogout,
    handleGoogleLogin,
  };
};
