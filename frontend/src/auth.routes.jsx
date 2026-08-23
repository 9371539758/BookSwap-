import { createBrowserRouter, Outlet, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import { useAuth } from "./features/auth/hooks/useAuth";
import Navbar from "./features/landing/components/Navbar";

// ─── LAZY PAGE IMPORTS ────────────────────────────────────────────────────────
// React.lazy() splits each page into its own JS chunk.
// The browser only downloads a page's code when the user navigates to it.
// This makes the initial app load significantly faster.

const Login       = lazy(() => import("./features/auth/pages/Login"));
const Register    = lazy(() => import("./features/auth/pages/Register"));
const AuthSuccess = lazy(() => import("./features/auth/pages/AuthSuccess"));
const Landing     = lazy(() => import("./features/landing/pages/Landing"));
const AddBook     = lazy(() => import("./features/book/pages/AddBook"));
const MyBooks     = lazy(() => import("./features/book/pages/MyBooks"));
const NearbyBooks = lazy(() => import("./features/book/pages/NearbyBooks"));
const Chats       = lazy(() => import("./features/chat/pages/Chats"));
const Browse      = lazy(() => import("./features/book/pages/Browse"));

// ─── PAGE LOADING FALLBACK ────────────────────────────────────────────────────
// Shown while a lazy page chunk is being downloaded.
// Keeps the dark background so there's no white flash.
const PageLoader = () => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#0f0f0f",
    color: "#6c63ff",
    fontSize: "1rem",
    fontFamily: "Inter, sans-serif",
    gap: "0.75rem",
  }}>
    <span style={{
      width: 20, height: 20,
      border: "2px solid rgba(108,99,255,0.3)",
      borderTopColor: "#6c63ff",
      borderRadius: "50%",
      display: "inline-block",
      animation: "spin 0.7s linear infinite",
    }} />
    Loading...
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── AUTH LAYOUT (No Navbar) ──────────────────────────────────────────────────
// Used for /login and /register.
// If already logged in → redirects to / automatically.
const AuthLayout = () => {
  const { isAuthenticated, initialized } = useAuth();

  if (!initialized) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
};

// ─── PROTECTED LAYOUT (With Navbar) ──────────────────────────────────────────
// Used for all pages requiring login.
// If NOT logged in → redirects to /login.
const ProtectedLayout = () => {
  const { isAuthenticated, initialized } = useAuth();

  if (!initialized) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </>
  );
};

// ─── ROUTER ───────────────────────────────────────────────────────────────────
// Route flow:
//   /login      → no navbar, redirect if logged in
//   /register   → no navbar, redirect if logged in
//   /auth/success → Google OAuth callback handler
//   /           → protected, Landing page
//   /browse     → protected, Browse all books
//   /nearby     → protected, Books near you
//   /add-book   → protected, List a book
//   /my-books   → protected, Your listings
//   /chats      → protected, Chat with book owners
//
// NOTE: vercel.json and public/_redirects ensure that refreshing any of these
//       URLs does NOT return a 404 from the deployment server.

const router = createBrowserRouter([
  // Google OAuth success handler — no layout needed
  // { path: "/auth/success", element: <Suspense fallback={<PageLoader />}><AuthSuccess /></Suspense> },
{
  path: "/auth/success",
  element: (
    <Suspense fallback={<PageLoader />}>
      <AuthSuccess />
    </Suspense>
  ),
},

  // ── Auth routes — no navbar ──
  {
    element: <AuthLayout />,
    children: [
      { path: "/login",    element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },

  // ── Protected routes — navbar shown, login required ──
  {
    element: <ProtectedLayout />,
    children: [
      { path: "/",         element: <Landing /> },
      { path: "/home",     element: <Landing /> },
      { path: "/browse",   element: <Browse /> },
      { path: "/nearby",   element: <NearbyBooks /> },
      { path: "/add-book", element: <AddBook /> },
      { path: "/my-books", element: <MyBooks /> },
      { path: "/chats",    element: <Chats /> },
    ],
  },
]);

export default router;
