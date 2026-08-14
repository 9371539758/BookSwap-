import { createContext, useReducer, useEffect } from "react";
import { getme } from "./services/auth.api";

// ─── CONTEXT ──────────────────────────────────────────────────────────────────
// AuthContext is shared across the entire app.
// Any component can read user state or dispatch actions via useAuth() hook.
export const AuthContext = createContext();

// ─── SESSION STORAGE HELPER ───────────────────────────────────────────────────
// sessionStorage acts like Redis — fast in-memory cache, cleared when browser closes.
// Unlike localStorage, it doesn't persist across sessions (safer for auth state).

const SESSION_KEY = "bookswap_session"; // key used to store user in sessionStorage

// Read user from sessionStorage cache (returns null if empty or corrupted)
const readSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
};

// Write user to sessionStorage cache
const writeSession = (user) => {
  if (user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("bookswap_token");
    sessionStorage.removeItem("bookswap_token");
  }
};

const initialState = {
  user: readSession(),
  loading: false,
  initialized: false,
};

// ─── REDUCER ──────────────────────────────────────────────────────────────────
// Pure function: takes current state + action, returns new state.
// This is the Redux pattern without needing the Redux library.

function authReducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      writeSession(action.payload);
      return { ...state, user: action.payload, loading: false, initialized: true };

    case "CLEAR_USER":
      writeSession(null);
      return { ...state, user: null, loading: false, initialized: true };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_INITIALIZED":
      return { ...state, initialized: true, loading: false };

    default:
      return state;
  }
}

// ─── AUTH PROVIDER ────────────────────────────────────────────────────────────
// Wraps the entire app. All children can access auth state via useAuth() hook.

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ─── SESSION RESTORE ────────────────────────────────────────────────────────
  // On first app load, call /getme to verify the JWT cookie is still valid.
  // If valid → update user data from DB (in case profile changed).
  // If expired/invalid → clear session and redirect to login.

  useEffect(() => {
    const verifySession = async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const data = await getme();
        dispatch({ type: "SET_USER", payload: data.user });
      } catch {
        dispatch({ type: "CLEAR_USER" });
      }
    };

    verifySession();
  }, []);

  // ─── CONTEXT VALUE ──────────────────────────────────────────────────────────
  // Expose state + dispatch to all children
  const value = {
    user: state.user,
    loading: state.loading,
    initialized: state.initialized,
    isAuthenticated: !!state.user,
    dispatch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};