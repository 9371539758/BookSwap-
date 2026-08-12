import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import "../styles/landing.scss";

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
// Shown ONLY when user is logged in (ProtectedLayout guards this route).
// This is the main homepage after authentication.

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // get current user for personalized greeting

  return (
    <div className="landing">

      {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="hero" id="home">
        <div className="hero__wrapper">

          {/* Left info panel */}
          <div className="hero__left">
            <div className="hero__info">
              <p className="hero__year">EST 2026</p>
              <p className="hero__description">
                Books find<br />
                new homes here
              </p>
              <p className="hero__mission">
                Your shelf is full.<br />
                Someone else needs<br />
                your books.<br />
                Make the swap.
              </p>
            </div>
          </div>

          {/* Center title */}
          <div className="hero__center">
            <h1 className="hero__title">
              THE BOOK<br />
              EXCHANGE
            </h1>
            {user && (
              <p className="hero__welcome">
                Welcome back, <strong>{user.fullName || user.username}</strong> 👋
              </p>
            )}
          </div>

          {/* Right showcase */}
          <div className="hero__right">
            <div className="hero__showcase">
              <div className="showcase-item">
                <div className="showcase-box">
                  <span className="showcase-icon">📖</span>
                  <span className="showcase-label">Fiction</span>
                </div>
              </div>
              <div className="showcase-item">
                <div className="showcase-box">
                  <span className="showcase-icon">🔬</span>
                  <span className="showcase-label">Science</span>
                </div>
              </div>
              <div className="showcase-item">
                <div className="showcase-box">
                  <span className="showcase-icon">🧠</span>
                  <span className="showcase-label">Self-Help</span>
                </div>
              </div>
            </div>
            <p
              className="hero__shop-label"
              onClick={() => navigate("/add-book")}
            >
              (list a book →)
            </p>
          </div>

        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────────────────── */}
      <section className="stats-strip">
        <div className="stats-strip__container">
          <div className="stat-item">
            <span className="stat-number">10K+</span>
            <span className="stat-label">Books Listed</span>
          </div>
          <div className="stat-divider">|</div>
          <div className="stat-item">
            <span className="stat-number">5K+</span>
            <span className="stat-label">Readers</span>
          </div>
          <div className="stat-divider">|</div>
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Cities</span>
          </div>
          <div className="stat-divider">|</div>
          <div className="stat-item">
            <span className="stat-number">Free</span>
            <span className="stat-label">To Join</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ────────────────────────────────────────────────── */}
      <section className="features" id="features">
        <div className="features__container">
          <h2 className="features__title">Why BookSwap?</h2>
          <p className="features__subtitle">
            The simplest way to give your books a second life
          </p>
          <div className="features__grid">
            <div className="feature-card">
              <div className="feature-card__number">01</div>
              <div className="feature-card__icon">📚</div>
              <h3 className="feature-card__title">List for Free</h3>
              <p className="feature-card__description">
                Upload your books in seconds. Add photos, set a price or offer for swap — it&apos;s completely free.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card__number">02</div>
              <div className="feature-card__icon">🔍</div>
              <h3 className="feature-card__title">Discover Locally</h3>
              <p className="feature-card__description">
                Find books in your city. Connect with readers nearby for easy handoffs without shipping.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card__number">03</div>
              <div className="feature-card__icon">🤝</div>
              <h3 className="feature-card__title">Swap or Sell</h3>
              <p className="feature-card__description">
                Exchange books you&apos;ve read for books you want, or sell them at a fair price to fellow readers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section className="how-it-works" id="how-it-works">
        <div className="how-it-works__container">
          <h2 className="how-it-works__title">How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step__number">1</div>
              <h3 className="step__title">List Your Books</h3>
              <p className="step__desc">Click &quot;List Book&quot; and add details about books you want to share</p>
            </div>
            <div className="step__arrow">→</div>
            <div className="step">
              <div className="step__number">2</div>
              <h3 className="step__title">Get Matched</h3>
              <p className="step__desc">Readers in your area discover your listing and reach out</p>
            </div>
            <div className="step__arrow">→</div>
            <div className="step">
              <div className="step__number">3</div>
              <h3 className="step__title">Make the Swap</h3>
              <p className="step__desc">Meet up or arrange delivery, complete the exchange, happy reading!</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ─────────────────────────────────────────────────────── */}
      <section className="cta-section" id="browse">
        <div className="cta-section__container">
          <h2 className="cta-section__title">Ready to list your first book?</h2>
          <p className="cta-section__subtitle">
            Join thousands of readers who are already swapping books
          </p>
          <div className="cta-section__actions">
            <button
              className="cta-section__btn cta-section__btn--primary"
              onClick={() => navigate("/add-book")}
            >
              + List a Book
            </button>
            <button
              className="cta-section__btn cta-section__btn--secondary"
              onClick={() => navigate("/my-books")}
            >
              Browse My Books
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Landing;