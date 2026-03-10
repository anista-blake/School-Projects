// NavBar.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Nav.css";

const NavBar = ({ theme, toggleTheme }) => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Fetch current user
  useEffect(() => {
    const controller = new AbortController();

    const fetchUser = async () => {
      try {
        const res = await fetch("/api/current-user", { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        setUser(data || null);
      } catch (err) {
        if (err.name !== "AbortError") console.error("User fetch error:", err);
      }
    };

    fetchUser();
    return () => controller.abort();
  }, []);

  // Close menu on outside click
  const handleClickOutside = useCallback((e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, handleClickOutside]);

  const handleLogout = async () => {
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta?.content;

    try {
      await fetch("/account/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRFToken": csrfToken }),
        },
      });
      setUser(null);
      setMenuOpen(false);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header
      className={`site-header ${user ? "has-avatar" : ""} ${theme === "dark" ? "dark-mode" : ""}`}
    >
      <div className="container">
        <h1 className="logo">Balance Bloom</h1>

        <nav>
          <ul className="menu">
            <li><a href="/">Home</a></li>

            <li>
              <button
                id="moreOptions"
                className="nav__options"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-controls="moreMenu"
                aria-label="More options"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                ☰
              </button>

              {menuOpen && (
                <ul
                  id="moreMenu"
                  className="nav__menu open"
                  role="menu"
                  ref={menuRef}
                >
                  <li><a role="menuitem" href="/about">About</a></li>
                  <li><a role="menuitem" href="/faq">FAQ</a></li>
                  {user?.track_period_data && (
                    <li><a role="menuitem" href="/cycle">Cycle Tracker</a></li>
                  )}
                  <li><a role="menuitem" href="/journal">Mood Journal</a></li>
                  <li><a role="menuitem" href="/recipe" className="btn">🍴 Open Recipe App</a></li>
                  <li><a role="menuitem" href="/settings">Settings</a></li>

                  {user ? (
                    <li>
                      <button
                        className="menu-auth-btn"
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        Log out
                      </button>
                    </li>
                  ) : (
                    <li>
                      <a role="menuitem" href="/login" className="menu-auth-btn">Log In</a>
                    </li>
                  )}
                </ul>
              )}
            </li>
          </ul>
        </nav>

        {user && (
          <a href="/account" className="header-avatar" aria-label="Account">
            <img
              src={user.avatar_url || "/static/img/account-placeholder-image.png"}
              alt="Account"
              width="36"
              height="36"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/static/img/account-placeholder-image.png";
              }}
            />
          </a>
        )}
      </div>
    </header>
  );
};

export default NavBar;
