import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../auth/hooks/useAuth";

const ChatContext = createContext(null);

// Socket connects to the backend server.
// In dev: Vite proxy handles /api but Socket.IO needs direct connection.
// In prod: VITE_SOCKET_URL or VITE_API_URL points to the backend.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

// ─── CHAT PROVIDER ────────────────────────────────────────────────────────────
// Manages a single Socket.IO connection for the logged-in user.
//
// AUTH STRATEGY:
//   Socket connects with `withCredentials: true` so the browser automatically
//   sends the httpOnly JWT cookie. The backend socket middleware reads that
//   cookie to identify the user — no localStorage token needed.
//   This is more secure: the cookie is httpOnly (JS cannot read/steal it).

export const ChatProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket]       = useState(null);
  const [isConnected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // User logged out — disconnect any existing socket immediately
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    // Create socket connection — browser sends JWT cookie automatically
    const client = io(SOCKET_URL, {
      withCredentials: true,   // sends httpOnly cookie for socket auth
      // auth.token is intentionally NOT set — we rely on cookies only
      // This prevents token leakage via URL params or logs
    });

    client.on("connect",    () => setConnected(true));
    client.on("disconnect", () => setConnected(false));

    // Log connection errors in development only
    client.on("connect_error", (err) => {
      if (import.meta.env.DEV) {
        console.warn("Socket connection error:", err.message);
      }
    });

    setSocket(client);

    // Cleanup: disconnect when user logs out or component unmounts
    return () => {
      client.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated]); // re-run only when auth state changes

  const value = useMemo(
    () => ({ socket, isConnected }),
    [socket, isConnected]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatSocket = () => useContext(ChatContext);
