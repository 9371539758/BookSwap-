import axios from "axios";

// ─── AXIOS INSTANCE ────────────────────────────────────────────────────────────
// Single axios instance for all API calls.
// baseURL is empty — Vite proxy forwards /api/* to http://localhost:3000
// withCredentials: true — sends httpOnly cookies on every request (for JWT auth)

const api = axios.create({
  baseURL: "", // empty: Vite proxy handles /api → backend:3000
  withCredentials: true, // REQUIRED: sends the JWT cookie with every request
});

// ─── AUTH API FUNCTIONS ────────────────────────────────────────────────────────

// POST /api/auth/register — create new account
// Sends: username, fullName, email, password, phone, location
export const register = async ({ username, fullName, email, password, phone, location }) => {
  const response = await api.post("/api/auth/register", {
    username,
    fullName,
    email,
    password,
    phone,
    location,
  });
  return response.data; // { success, message, user }
};

// POST /api/auth/login — login with email or username + password
// Sends: identifier (email or username), password
export const login = async ({ identifier, password }) => {
  const response = await api.post("/api/auth/login", { identifier, password });
  return response.data; // { success, message, user }
};

// POST /api/auth/logout — clears JWT cookie on server + logs out
export const logout = async () => {
  const response = await api.post("/api/auth/logout");
  return response.data; // { success, message }
};

// GET /api/auth/getme — returns current logged-in user's data
// Called on every page refresh to restore session from cookie
export const getme = async () => {
  const response = await api.get("/api/auth/getme");
  return response.data; // { success, user }
};

// ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────────
// Redirects browser to backend Google OAuth page.
// The Vite proxy only handles XHR requests — for full redirects we use port 3000 directly.
export const googleLogin = () => {
  window.location.href = "http://localhost:3000/api/auth/google";
};
