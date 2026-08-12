import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBooks, deleteBook } from "../services/book.api";
import "./book.pages.scss";

// ─── MY BOOKS PAGE ────────────────────────────────────────────────────────────
// Protected page — shows all books the current user has listed.
// Allows user to delete their own listings.
// On first load → calls /api/books/my-books with JWT cookie for auth.

const MyBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null); // tracks which book is being deleted

  // Fetch user's books on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMyBooks();
        setBooks(data.books || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Could not load your books");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Delete a book by ID and remove it from local state
  const handleDelete = async (id) => {
    if (!confirm("Remove this book listing?")) return;
    setDeleting(id);
    try {
      await deleteBook(id);
      setBooks(books.filter((b) => b._id !== id)); // optimistic UI update
    } catch (err) {
      setError("Failed to delete book");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="book-page book-page--loading">
        <div className="spinner-large" />
        <p>Loading your books...</p>
      </div>
    );
  }

  return (
    <div className="book-page">
      <div className="book-page__container">

        {/* Header */}
        <div className="book-page__header">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back
          </button>
          <h1 className="book-page__title">My Books</h1>
          <p className="book-page__subtitle">
            {books.length} book{books.length !== 1 ? "s" : ""} listed
          </p>
        </div>

        {error && <div className="form-error">⚠ {error}</div>}

        {books.length === 0 ? (
          // Empty state
          <div className="empty-state">
            <div className="empty-state__icon">📚</div>
            <h3>No books listed yet</h3>
            <p>Start by listing a book from your shelf</p>
            <button
              className="submit-btn"
              onClick={() => navigate("/add-book")}
            >
              + List your first book
            </button>
          </div>
        ) : (
          <>
            {/* Add more button */}
            <div className="my-books__actions">
              <button
                className="add-more-btn"
                onClick={() => navigate("/add-book")}
              >
                + Add Another Book
              </button>
            </div>

            {/* Books grid */}
            <div className="books-grid">
              {books.map((book) => (
                <div className="book-card" key={book._id}>
                  {/* Cover image or placeholder */}
                  <div className="book-card__cover">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} />
                    ) : (
                      <div className="book-card__cover-placeholder">📖</div>
                    )}
                    {/* Available badge */}
                    <span className={`book-card__badge ${book.available ? "badge--available" : "badge--sold"}`}>
                      {book.available ? "Available" : "Sold"}
                    </span>
                  </div>

                  <div className="book-card__info">
                    <h3 className="book-card__title">{book.title}</h3>
                    <p className="book-card__author">by {book.author}</p>
                    <p className="book-card__price">₹{book.price?.toFixed(2)}</p>
                    {book.description && (
                      <p className="book-card__desc">{book.description}</p>
                    )}
                  </div>

                  <div className="book-card__actions">
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(book._id)}
                      disabled={deleting === book._id}
                    >
                      {deleting === book._id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyBooks;
