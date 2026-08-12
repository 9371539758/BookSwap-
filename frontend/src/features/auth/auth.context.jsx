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
    sessionStorage.removeItem(SESSION_KEY); // clear on logout
  }
};

// ─── INITIAL STATE ────────────────────────────────────────────────────────────
// Hydrate from sessionStorage so page refresh doesn't flicker to logged-out state

const initialState = {
  user: readSession(),      // current logged-in user object (or null)
  loading: false,           // true when any auth API call is in progress
  initialized: false,       // true after first /getme check completes
};

// ─── REDUCER ──────────────────────────────────────────────────────────────────
// Pure function: takes current state + action, returns new state.
// This is the Redux pattern without needing the Redux library.

function authReducer(state, action) {
  switch (action.type) {

    // Called when login/register succeeds — store user in state + sessionStorage
    case "SET_USER":
      writeSession(action.payload);
      return { ...state, user: action.payload, loading: false, initialized: true };

    // Called on logout or session expiry — wipe user from state + sessionStorage
    case "CLEAR_USER":
      writeSession(null);
      return { ...state, user: null, loading: false, initialized: true };

    // Called before any async auth operation starts
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    // Called after /getme completes (success or fail) — marks app as ready
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
        // Cookie is valid — update user with fresh data from DB
        dispatch({ type: "SET_USER", payload: data.user });
      } catch {
        // Cookie expired or user deleted — clear the stale session
        dispatch({ type: "CLEAR_USER" });
      }
    };

    verifySession();
  }, []); // runs only once on mount

  // ─── CONTEXT VALUE ──────────────────────────────────────────────────────────
  // Expose state + dispatch to all children
  const value = {
    user: state.user,
    loading: state.loading,
    initialized: state.initialized,
    isAuthenticated: !!state.user, // boolean shorthand for easy checks
    dispatch,                      // children use dispatch to trigger state changes
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};