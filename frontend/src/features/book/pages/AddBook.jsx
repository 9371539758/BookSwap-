import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBook } from "../services/book.api";
import { uploadCover } from "../services/upload.api"; // uploads file to backend -> returns URL
import "./book.pages.scss";

// ─── ADD BOOK PAGE (extended to match backend Book model) ──────────────────────
// Adds fields: isbn, category, condition, language, publicationYear, location

const AddBook = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [coverFile, setCoverFile] = useState(null); // store the File object to upload

  // Expanded form state to match backend model
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    condition: "Good",
    language: "English",
    publicationYear: "",
    price: "",
    description: "",
    coverImage: "",
    location: { city: "", state: "", coordinates: {} },
    available: true,
  });

  // Generic change handler that supports nested fields like location.city
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setForm((prev) => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Keep the selected File for uploading. Create a local preview using a blob URL.
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview using a temporary object URL (no base64 conversion)
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);

    // Keep the File for upload; backend will accept the uploaded file and return a URL
    setCoverFile(file);

    // Also clear any previous coverImage string stored in form
    setForm((prev) => ({ ...prev, coverImage: "" }));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location is not supported by this browser");
      return;
    }
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: { latitude: coords.latitude, longitude: coords.longitude },
          },
        }));
      },
      () => setError("We could not get your location. Please allow location access and try again."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Minimal client-side validation (backend also validates)
    if (!form.title.trim() || !form.author.trim()) {
      setError("Title and author are required");
      return;
    }

    try {
      setLoading(true);

      // Build payload: convert numbers and remove empty nested objects
      const payload = {
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim() || undefined,
        category: form.category.trim() || undefined,
        condition: form.condition,
        language: form.language.trim() || undefined,
        publicationYear: form.publicationYear ? Number(form.publicationYear) : undefined,
        price: form.price !== "" ? Number(form.price) : undefined,
        description: form.description.trim() || undefined,
        coverImage: undefined, // will fill after uploading the file (if any)
        available: !!form.available,
      };

      // Attach location only when provided
      if (form.location?.city || form.location?.state || form.location?.coordinates?.latitude != null) {
        payload.location = {
          city: form.location.city?.trim() || undefined,
          state: form.location.state?.trim() || undefined,
          coordinates: form.location.coordinates?.latitude != null
            ? form.location.coordinates
            : undefined,
        };
      }

      // If the user selected a file, upload it first to /api/uploads
      if (coverFile) {
        // uploadCover returns the public URL of the uploaded image
        const imageUrl = await uploadCover(coverFile);
        payload.coverImage = imageUrl;
      } else if (form.coverImage) {
        // fallback: if form.coverImage already contains a URL (rare), use it
        payload.coverImage = form.coverImage;
      }

      await createBook(payload);

      setSuccess("Book listed successfully!");
      setTimeout(() => navigate("/my-books"), 800);
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
          <p className="book-page__subtitle">Share a book from your shelf with fellow readers</p>
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
                <input id="title" name="title" type="text" placeholder="e.g. Atomic Habits" value={form.title} onChange={handleChange} />
              </div>

              <div className="field">
                <label htmlFor="author">Author *</label>
                <input id="author" name="author" type="text" placeholder="e.g. James Clear" value={form.author} onChange={handleChange} />
              </div>
            </div>

            <div className="field">
              <button className="location-btn" type="button" onClick={useCurrentLocation}>
                {form.location.coordinates?.latitude != null ? "✓ Listing location added" : "Use my current location for nearby matching"}
              </button>
              <small className="location-help">Your precise coordinates are used only to calculate nearby book distances.</small>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="isbn">ISBN</label>
                <input id="isbn" name="isbn" type="text" placeholder="Optional ISBN" value={form.isbn} onChange={handleChange} />
              </div>

              <div className="field">
                <label htmlFor="category">Category</label>
                <input id="category" name="category" type="text" placeholder="e.g. Fiction" value={form.category} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="condition">Condition</label>
                <select id="condition" name="condition" value={form.condition} onChange={handleChange}>
                  <option>Like New</option>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Poor</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="language">Language</label>
                <input id="language" name="language" type="text" value={form.language} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="publicationYear">Publication Year</label>
                <input id="publicationYear" name="publicationYear" type="number" min="1000" max={new Date().getFullYear()} value={form.publicationYear} onChange={handleChange} />
              </div>

              <div className="field">
                <label htmlFor="price">Price (₹)</label>
                <input id="price" name="price" type="number" min="0" placeholder="e.g. 150" value={form.price} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="location.city">City</label>
                <input id="location.city" name="location.city" type="text" value={form.location.city} onChange={handleChange} />
              </div>

              <div className="field">
                <label htmlFor="location.state">State</label>
                <input id="location.state" name="location.state" type="text" value={form.location.state} onChange={handleChange} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="coverImage">Cover Image</label>
              <input id="coverImage" name="coverImage" type="file" accept="image/*" onChange={handleFile} className="file-input" />
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" placeholder="Brief description of the book condition, edition, etc." value={form.description} onChange={handleChange} rows={4} />
            </div>

            <div className="field field--checkbox">
              <label className="checkbox-label">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm((prev) => ({ ...prev, available: e.target.checked }))} />
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
