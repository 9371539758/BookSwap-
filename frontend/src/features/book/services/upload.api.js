// frontend/src/features/book/services/upload.api.js
// Uploads a file to the backend /api/uploads endpoint using multipart/form-data
import axios from "axios";

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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

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

export const uploadCover = async (file) => {
  const fd = new FormData();
  fd.append("file", file); // field name must match multer .single('file')

  const res = await api.post("/api/uploads", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // backend returns { success: true, url }
  return res.data.url;
};
