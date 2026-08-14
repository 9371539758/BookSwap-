import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production"
    ? "https://bookswap-backend-vvkg.onrender.com"
    : "http://localhost:3000");

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const getStoredToken = () => {
  try {
    return (
      localStorage.getItem("bookswap_token") ||
      sessionStorage.getItem("bookswap_token") ||
      ""
    );
  } catch {
    return "";
  }
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export const register = async ({
  username,
  fullName,
  email,
  password,
  phone,
  location,
}) => {
  const response = await api.post("/api/auth/register", {
    username,
    fullName,
    email,
    password,
    phone,
    location,
  });

  return response.data;
};

export const login = async ({ identifier, password }) => {
  const response = await api.post("/api/auth/login", {
    identifier,
    password,
  });

  if (response.data?.token) {
    try {
      localStorage.setItem("bookswap_token", response.data.token);
      sessionStorage.setItem("bookswap_token", response.data.token);
    } catch {
      // ignore storage errors in restricted environments
    }
  }

  return response.data;
};

export const logout = async () => {
  try {
    localStorage.removeItem("bookswap_token");
    sessionStorage.removeItem("bookswap_token");
  } catch {
    // ignore
  }

  const response = await api.post("/api/auth/logout");
  return response.data;
};

export const getme = async () => {
  const response = await api.get("/api/auth/getme");
  return response.data;
};

export const googleLogin = () => {
  window.location.href = `${API_URL}/api/auth/google`;
};
