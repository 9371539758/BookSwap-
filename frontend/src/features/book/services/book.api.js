import axios from "axios";

// ─── BOOK API AXIOS INSTANCE ──────────────────────────────────────────────────
// Shared axios instance for all book-related API calls.
// withCredentials: true — sends the JWT cookie set during login.
// baseURL is empty — Vite proxy forwards /api/* requests to backend:3000

const api = axios.create({
  baseURL: "", // empty: Vite proxy handles /api → backend:3000
  withCredentials: true, // REQUIRED: sends JWT cookie for protected book routes
});

// ─── BOOK API FUNCTIONS ───────────────────────────────────────────────────────

// POST /api/books — create a new book listing
// Sends: title, author, price, description, coverImage, available
export const createBook = async (bookData) => {
  const response = await api.post("/api/books", bookData);
  // backend returns: { success, message, data: savedBook }
  return response.data.data; // return saved book object
};

// GET /api/books — get all books (public browse)
export const getBooks = async () => {
  const response = await api.get("/api/books");
  return response.data; // { success, books }
};

// GET /api/books/my — get only the current user's books
// Protected route — requires valid JWT cookie
export const getMyBooks = async () => {
  try {
    const response = await api.get("/api/books/my");
    // backend responds { success, count, data: [books] }
    return response.data.data; // returns the array of books
  } catch (error) {
    if (error.response?.status === 404) {
      const legacyResponse = await api.get("/api/books/my-books");
      return legacyResponse.data.data;
    }
    throw error;
  }
};

// DELETE /api/books/:id — delete a book by ID
export const deleteBook = async (id) => {
  const response = await api.delete(`/api/books/${id}`);
  return response.data; // { success, message }
};
