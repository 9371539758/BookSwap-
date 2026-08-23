import axios from "axios";

// ─── AXIOS INSTANCE ───────────────────────────────────────────────────────────
// withCredentials: true sends the httpOnly JWT cookie on every request.
// baseURL is empty in dev — Vite proxy routes /api/* to backend:3000.
// In production, VITE_API_URL is set to the backend Render URL.
//
// NO localStorage token — auth is cookie-based only (more secure).

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true, // sends httpOnly JWT cookie automatically
});

// ─── BOOK API FUNCTIONS ───────────────────────────────────────────────────────

// POST /api/books — create a new book listing (auth required)
export const createBook = async (bookData) => {
  const response = await api.post("/api/books", bookData);
  return response.data.data;
};

// GET /api/books — browse all books (public, no auth needed)
export const getBooks = async (params = {}) => {
  const response = await api.get("/api/books", { params });
  return response.data;
};

// GET /api/books/nearby?latitude=xx&longitude=yy&radiusKm=50
// Returns books sorted by distance from the user's location.
// Server uses MongoDB $geoNear aggregation for accuracy.
export const getNearbyBooks = async (latitude, longitude, radiusKm = 50) => {
  const response = await api.get("/api/books/nearby", {
    params: { latitude, longitude, radiusKm },
  });
  return response.data.data; // array of books with .distanceKm field
};

// GET /api/books/my — get books listed by the logged-in user
export const getMyBooks = async () => {
  const response = await api.get("/api/books/my");
  return response.data.data;
};

// DELETE /api/books/:id — delete a book (only the owner can do this)
export const deleteBook = async (id) => {
  const response = await api.delete(`/api/books/${id}`);
  return response.data;
};
