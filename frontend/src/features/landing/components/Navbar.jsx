import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useState, useEffect } from "react";
import { useChatSocket } from "../../chat/chat.context";
import { fetchConnections } from "../../chat/services/chat.api";
import "../styles/navbar.scss";

const Navbar = () => {
  const { socket } = useChatSocket();
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [incomingCount, setIncomingCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // ── Incoming connections count ──────────────────────────────────────────────
  const loadIncomingCount = async () => {
    try {
      const connections = await fetchConnections();
      setIncomingCount(connections.incoming.length);
    } catch {
      setIncomingCount(0);
    }
  };

  useEffect(() => {
    if (user) loadIncomingCount();
  }, [user?._id]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(loadIncomingCount, 5000);
    return () => clearInterval(interval);
  }, [user?._id]);

  useEffect(() => {
    if (!socket) return;
    socket.on("connection:incoming", loadIncomingCount);
    socket.on("connection:accepted", loadIncomingCount);
    socket.on("connection:rejected", loadIncomingCount);
    return () => {
      socket.off("connection:incoming", loadIncomingCount);
      socket.off("connection:accepted", loadIncomingCount);
      socket.off("connection:rejected", loadIncomingCount);
    };
  }, [socket]);

  // ── Scroll hide/show ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);

      if (currentY < 50) {
        setIsVisible(true);
      } else if (currentY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // ── Body scroll lock when menu open ─────────────────────────────────────────
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  // ── Close menu on route change ──────────────────────────────────────────────
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const onLogout = async () => {
    setMenuOpen(false);
    await handleLogout();
    navigate("/login");
  };

  return (
    <nav
      className={`navbar ${!isVisible ? "navbar--hidden" : ""} ${
        scrolled ? "navbar--scrolled" : ""
      } ${menuOpen ? "navbar--menu-open" : ""}`}
    >
      <div className="navbar__container">
        {/* Logo */}
        <div className="navbar__logo" onClick={() => go("/")}>
          <span className="navbar__logo-icon">📚</span>
          <span className="navbar__logo-text">BookSwap</span>
        </div>

        {/* Desktop Menu */}
        <ul className="navbar__menu">
          <li className="navbar__item">
            <a href="#features" className="navbar__link">
              Features
            </a>
          </li>
          <li className="navbar__item">
            <a href="#how-it-works" className="navbar__link">
              How It Works
            </a>
          </li>
          <li className="navbar__item">
            <button
              className="navbar__link"
              onClick={() => navigate("/browse")}
              type="button"
            >
              Browse
            </button>
          </li>
        </ul>

        {/* Desktop Auth */}
        <div className="navbar__auth">
          {user ? (
            <>
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
                className="navbar__btn navbar__btn--secondary"
                onClick={() => navigate("/nearby")}
              >
                Nearby Books
              </button>
              <button
                className="navbar__btn navbar__btn--secondary"
                onClick={() => navigate("/chats")}
              >
                Chats
              </button>

              <button
                className="navbar__notification"
                onClick={() => navigate("/chats")}
                type="button"
                aria-label={`Connection requests: ${incomingCount}`}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                </svg>
                {incomingCount > 0 && (
                  <span>{incomingCount > 99 ? "99+" : incomingCount}</span>
                )}
              </button>

              <button className="navbar__btn navbar__btn--logout" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
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
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
        className={`navbar__hamburger ${menuOpen ? "navbar__hamburger--open" : ""}`}
  onClick={() => setMenuOpen((prev) => !prev)}
  type="button"
>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      <div className={`navbar__mobile-menu ${menuOpen ? "navbar__mobile-menu--open" : ""}`}>
        <ul className="navbar__mobile-links">
          <li>
            <button className="navbar__mobile-link" onClick={() => go("/browse")} type="button">
              Browse
            </button>
          </li>

          {user && (
            <>
              <li>
                <button className="navbar__mobile-link" onClick={() => go("/add-book")} type="button">
                  + List Book
                </button>
              </li>
              <li>
                <button className="navbar__mobile-link" onClick={() => go("/my-books")} type="button">
                  My Books
                </button>
              </li>
              <li>
                <button className="navbar__mobile-link" onClick={() => go("/nearby")} type="button">
                  Nearby Books
                </button>
              </li>
              <li>
                <button className="navbar__mobile-link" onClick={() => go("/chats")} type="button">
                  Chats
                  {incomingCount > 0 && (
                    <span className="navbar__mobile-badge">
                      {incomingCount > 99 ? "99+" : incomingCount}
                    </span>
                  )}
                </button>
              </li>
            </>
          )}
        </ul>

        <div className="navbar__mobile-auth">
          {user ? (
            <>
              <div className="navbar__mobile-user">
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

              <button className="navbar__btn navbar__btn--logout" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="navbar__btn navbar__btn--login" onClick={() => go("/login")}>
                Login
              </button>
              <button className="navbar__btn navbar__btn--signup" onClick={() => go("/register")}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;