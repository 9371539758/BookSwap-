import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBook } from "../services/book.api";
import "./book.pages.scss";

// ─── ADD BOOK PAGE ────────────────────────────────────────────────────────────
// Protected page — only accessible when logged in (ProtectedLayout guards it).
// Allows user to create a new book listing with title, author, price, etc.
// After successful submit → redirects to /my-books

const AddBook = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  // All form fields in one state object (cleaner than multiple useState)
  const [form, setForm] = useState({
    title: "",
    author: "",
    price: "",
    description: "",
    coverImage: "",
    available: true,
  });

  // Generic change handler for all text inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Convert selected image file to base64 for preview + upload
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result);    // show preview
      setForm({ ...form, coverImage: reader.result }); // store in form
    };
    reader.readAsDataURL(file);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title || !form.author || form.price === "") {
      setError("Title, author, and price are required");
      return;
    }

    try {
      setLoading(true);
      await createBook({
        ...form,
        price: Number(form.price), // convert string to number
      });
      setSuccess("Book listed successfully!");
      setTimeout(() => navigate("/my-books"), 1000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-page">
      <div className="book-page__container">

        {/* Header */}
        <div className="book-page__header">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back
          </button>
          <h1 className="book-page__title">List a Book</h1>
          <p className="book-page__subtitle">
            Share a book from your shelf with fellow readers
          </p>
        </div>

        <div className="book-page__content">
          {/* Cover preview panel */}
          <div className="cover-preview-panel">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover preview" className="cover-preview__img" />
            ) : (
              <div className="cover-preview__placeholder">
                <span>📖</span>
                <p>Cover preview</p>
              </div>
            )}
          </div>

          {/* Form */}
          <form className="book-form" onSubmit={submitHandler}>
            {error && <div className="form-error">⚠ {error}</div>}
            {success && <div className="form-success">✓ {success}</div>}

            <div className="form-row">
              <div className="field">
                <label htmlFor="title">Book Title *</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g. Atomic Habits"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="author">Author *</label>
                <input
                  id="author"
                  name="author"
                  type="text"
                  placeholder="e.g. James Clear"
                  value={form.author}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="price">Price (₹) *</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  placeholder="e.g. 150"
                  value={form.price}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="coverImage">Cover Image</label>
                <input
                  id="coverImage"
                  name="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="file-input"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Brief description of the book condition, edition, etc."
                value={form.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="field field--checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) => setForm({ ...form, available: e.target.checked })}
                />
                <span>Available for swap/sale</span>
              </label>
            </div>

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? "Listing book..." : "+ List My Book"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBook;
