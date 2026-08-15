const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const headers = () => {
  const token = localStorage.getItem("bookswap_token") || sessionStorage.getItem("bookswap_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const request = async (path) => {
  const response = await fetch(`${API_URL}${path}`, { credentials: "include", headers: headers() });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || "Request failed");
  return data.data;
};
export const fetchConnections = () => request("/api/connections");
export const fetchMessages = (connectionId) => request(`/api/connections/${connectionId}/messages`);
