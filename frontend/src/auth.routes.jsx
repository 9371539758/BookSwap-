import { createBrowserRouter, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "./features/auth/hooks/useAuth";
import Navbar from "./features/landing/components/Navbar";

// ─── Page Imports ─────────────────────────────────────────────────────────────
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import AuthSuccess from "./features/auth/pages/AuthSuccess";
import Landing from "./features/landing/pages/Landing";
import AddBook from "./features/book/pages/AddBook";
import MyBooks from "./features/book/pages/MyBooks";

// ─── AUTH LAYOUT (No Navbar) ──────────────────────────────────────────────────
// Used for /login and /register pages.
// If user is already logged in → redirect to home automatically.
const AuthLayout = () => {
  const { isAuthenticated, initialized } = useAuth();

  // Wait until session verification completes before deciding to redirect
  if (!initialized) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f0f0f", color: "#fff" }}>
        Loading...
      </div>
    );
  }

  // Already logged in → no need to see login/register → go to landing
  if (isAuthenticated) return <Navigate to="/" replace />;

  // Not logged in → show the auth page (no navbar rendered)
  return <Outlet />;
};

// ─── PROTECTED LAYOUT (With Navbar) ──────────────────────────────────────────
// Used for all pages that require login: /, /home, /add-book, /my-books
// If user is NOT logged in → redirect to /login
const ProtectedLayout = () => {
  const { isAuthenticated, initialized } = useAuth();

  // Wait for session check to complete
  if (!initialized) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f0f0f", color: "#fff" }}>
        Loading...
      </div>
    );
  }

  // Not logged in → redirect to login page
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Logged in → show Navbar + page content
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

// ─── ROUTER ───────────────────────────────────────────────────────────────────
// Route flow:
//  /login  → AuthLayout (no navbar) → Login page
//  /register → AuthLayout (no navbar) → Register page
//  / or /home → ProtectedLayout (with navbar) → Landing page
//  /add-book → ProtectedLayout (with navbar) → AddBook page
//  /my-books → ProtectedLayout (with navbar) → MyBooks page

const router = createBrowserRouter([
  { path: "/auth/success", element: <AuthSuccess /> },

  // ── Auth routes — no navbar, redirect if already logged in ──
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },

  // ── Protected routes — with navbar, redirect if not logged in ──
  {
    element: <ProtectedLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/home", element: <Landing /> },
      { path: "/add-book", element: <AddBook /> },
      { path: "/my-books", element: <MyBooks /> },
    ],
  },
]);

export default router;