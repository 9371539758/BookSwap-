import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
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

  return response.data;
};

export const logout = async () => {
  const response = await api.post("/api/auth/logout");
  return response.data;
};

export const getme = async () => {
  const response = await api.get("/api/auth/getme");
  return response.data;
};

export const googleLogin = () => {
  window.location.href = `${
    import.meta.env.VITE_API_URL
  }/api/auth/google`;
};