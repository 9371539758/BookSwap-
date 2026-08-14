import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useState, useEffect } from "react";
import "../styles/navbar.scss";

// ─── NAVBAR COMPONENT ─────────────────────────────────────────────────────────
// Only shown on PROTECTED pages (/, /home, /add-book, /my-books).
// Auth pages (/login, /register) use a separate AuthLayout with NO navbar.
// Scroll behavior: hides when scrolling down, reappears on scroll up.

const Navbar = () => {
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth(); // FIX: was `logout` — correct name is `handleLogout`
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrolled, setScrolled] = useState(false); // adds shadow after scrolling

  // ─── SCROLL BEHAVIOR ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      if (currentScrollY < 50) {
        setIsVisible(true); // always show at top of page
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false); // hide when scrolling down
      } else {
        setIsVisible(true); // show when scrolling up
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // ─── LOGOUT HANDLER ───────────────────────────────────────────────────────────
  const onLogout = async () => {
    await handleLogout(); // clears sessionStorage + server cookie
    navigate("/login");   // redirect to login page after logout
  };

  return (
    <nav className={`navbar ${!isVisible ? "navbar--hidden" : ""} ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar__container">

        {/* ── Logo ── */}
        <div className="navbar__logo" onClick={() => navigate("/")}>
          <span className="navbar__logo-icon">📚</span>
          <span className="navbar__logo-text">BookSwap</span>
        </div>

        {/* ── Navigation links (shown on landing page sections) ── */}
        <ul className="navbar__menu">
          <li className="navbar__item">
            <a href="#features" className="navbar__link">Features</a>
          </li>
          <li className="navbar__item">
            <a href="#how-it-works" className="navbar__link">How It Works</a>
          </li>
          <li className="navbar__item">
            <a href="#browse" className="navbar__link">Browse</a>
          </li>
        </ul>

        {/* ── Auth Section ── */}
        <div className="navbar__auth">
          {user ? (
            // ── Logged in state ──
            <>
              {/* Show user avatar or initials */}
              <div className="navbar__user">
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className="navbar__avatar" />
                ) : (
                  <div className="navbar__avatar-placeholder">
                    {(user.fullName || user.username || "U")[0].toUpperCase()}
                  </div>
                )}
                <span className="navbar__username">
                  {user.fullName || user.username}
                </span>
              </div>

              <button
                className="navbar__btn navbar__btn--secondary"
                onClick={() => navigate("/add-book")}
              >
                + List Book
              </button>

              <button
                className="navbar__btn navbar__btn--secondary"
                onClick={() => navigate("/my-books")}
              >
                My Books
              </button>

              <button
                className="navbar__btn navbar__btn--logout"
                onClick={onLogout}
              >
                Logout
              </button>
            </>
          ) : (
            // ── Not logged in state ──
            <>
              <button
                className="navbar__btn navbar__btn--login"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="navbar__btn navbar__btn--signup"
                onClick={() => navigate("/register")}
              >
                Sign Up
              </button>

              <button
  className="navbar__theme-toggle"
  onClick={toggleTheme}
  aria-label="Toggle theme"
>
  <span className="navbar__theme-icon">
    {isDark ? "☀️" : "🌙"}
  </span>
</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
