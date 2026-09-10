// ─── CHAT API ──────────────────────────────────────────────────────────────────
// Uses the browser's httpOnly cookie for auth (set during login/register).
// withCredentials: true on fetch ensures the cookie is sent automatically.
//
// NO localStorage token needed — cookies handle auth securely.
// The backend authMiddleware reads the "token" cookie on every request.

const API_URL = import.meta.env.VITE_API_URL || "";

// Generic fetch wrapper — always sends cookies, always expects { success, data }
const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include", // REQUIRED: sends httpOnly JWT cookie with every request
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Request failed");
  }

  return data.data;
};

// GET /api/connections — fetch incoming, outgoing, and accepted chats
// PRIVACY: backend only returns connections where the user is a participant
export const fetchConnections = () => request("/api/connections");

// GET /api/connections/:connectionId/messages — fetch chat history
// PRIVACY: backend verifies the requesting user is one of the two participants
export const fetchMessages = (connectionId) =>
  request(`/api/connections/${connectionId}/messages`);

// DELETE /api/connections/:connectionId — hide the chat for the current user only
export const deleteConnectionForUser = (connectionId) =>
  request(`/api/connections/${connectionId}`, { method: "DELETE" });
