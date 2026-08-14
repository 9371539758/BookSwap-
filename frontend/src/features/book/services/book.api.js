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

export const createBook = async (bookData) => {
  const response = await api.post("/api/books", bookData);
  return response.data.data;
};

export const getBooks = async () => {
  const response = await api.get("/api/books");
  return response.data;
};

export const getMyBooks = async () => {
  try {
    const response = await api.get("/api/books/my");
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      const legacyResponse = await api.get("/api/books/my-books");
      return legacyResponse.data.data;
    }
    throw error;
  }
};

export const deleteBook = async (id) => {
  const response = await api.delete(`/api/books/${id}`);
  return response.data;
};
