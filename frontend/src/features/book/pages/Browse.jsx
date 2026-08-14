import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./browse.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const fetchBooks = async () => {
  const res = await fetch(`${API_URL}/api/books`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message || "Failed to load books");
  }

  return data.data || [];
};

const Browse = () => {
  const [search, setSearch] = useState("");

  const {
    data: books = [],
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["books"],
    queryFn: fetchBooks,
  });

  const filteredBooks = books.filter(
    (book) =>
      book.title?.toLowerCase().includes(search.toLowerCase()) ||
      book.author?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="browse-page">
        <div className="browse-page__status">Loading books...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="browse-page">
        <div className="browse-page__status browse-page__status--error">
          {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      <div className="browse-page__header">
        <h1 className="browse-page__title">Browse Books</h1>
        {isFetching && (
          <span className="browse-page__updating">Updating...</span>
        )}
      </div>

      <input
        type="text"
        className="browse-page__search"
        placeholder="Search by title or author..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredBooks.length === 0 ? (
        <motion.p
          className="browse-page__empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          No books found.
        </motion.p>
      ) : (
        <div className="browse-page__grid">
          <AnimatePresence mode="popLayout">
            {filteredBooks.map((book) => (
              <motion.div
                key={book._id}
                className="book-card"
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1], // Apple-like easing
                }}
              >
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="book-card__image"
                  />
                ) : (
                  <div className="book-card__placeholder">📚</div>
                )}

                <div className="book-card__body">
                  <h3 className="book-card__title">{book.title}</h3>
                  <p className="book-card__author">by {book.author}</p>
                  <p className="book-card__meta">
                    {book.condition} • {book.category}
                  </p>
                  {book.price > 0 && (
                    <p className="book-card__price">₹{book.price}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Browse;