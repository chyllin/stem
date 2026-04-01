import { useState } from "react";
import type { Page, CurrentUser } from "../../types";
import "./Navbar.css";

interface NavbarProps {
  currentPage: Page;
  currentUser: CurrentUser | null;
  onNavigate: (page: Page) => void;
  onLogout?: () => void;
}

// Nav links per role
const NAV_LINKS: Record<string, { page: Page; icon: string; label: string }[]> = {
  Parent: [
    { page: "tutors",    icon: "fa-search",    label: "Find Tutors" },
    { page: "dashboard", icon: "fa-th-large",  label: "Dashboard" },
    { page: "about",     icon: "fa-info-circle", label: "About" },
  ],
  Tutor: [
    { page: "tutors",          icon: "fa-search",    label: "Browse" },
    { page: "tutor-dashboard", icon: "fa-th-large",  label: "Dashboard" },
    { page: "about",           icon: "fa-info-circle", label: "About" },
  ],
  Admin: [
    { page: "tutors",    icon: "fa-users",     label: "Tutors" },
    { page: "analytics", icon: "fa-chart-bar", label: "Analytics" },
    { page: "about",     icon: "fa-info-circle", label: "About" },
  ],
  guest: [
    { page: "tutors", icon: "fa-search",      label: "Find Tutors" },
    { page: "about",  icon: "fa-info-circle", label: "About" },
  ],
};

export default function Navbar({ currentPage, currentUser, onNavigate, onLogout }: NavbarProps) {
  const [dropOpen, setDropOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (p: Page) => { onNavigate(p); setDropOpen(false); setMenuOpen(false); };

  const role   = currentUser?.role ?? "guest";
  const links  = NAV_LINKS[role] ?? NAV_LINKS.guest;

  return (
    <nav className="navbar">
      <div className="nav-inner">

        {/* Brand */}
        <button className="nav-brand" onClick={() => handleNav("home")}>
          <i className="fas fa-graduation-cap" />
          <span>STEM Tutor Finder</span>
        </button>

        {/* Links */}
        <div className={`nav-links${menuOpen ? " open" : ""}`}>
          {links.map((l) => (
            <button
              key={l.page}
              className={`nav-link${currentPage === l.page ? " active" : ""}`}
              onClick={() => handleNav(l.page)}
            >
              <i className={`fas ${l.icon}`} /> {l.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="nav-actions">
          {!currentUser ? (
            <div className="nav-auth-btns">
              <button className="btn btn-outline btn-sm" onClick={() => handleNav("login")}>
                <i className="fas fa-sign-in-alt" /> Login
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => handleNav("register")}>
                <i className="fas fa-user-plus" /> Register
              </button>
            </div>
          ) : (
            <div className="nav-user">
              <button className="nav-user-btn" onClick={() => setDropOpen((d) => !d)}>
                <div className="nav-avatar">
                  {currentUser.first_name?.[0] ?? "?"}{currentUser.last_name?.[0] ?? ""}
                </div>
                <span>{currentUser.first_name || currentUser.username}</span>
                <span className={`nav-role-badge nav-role-${(currentUser.role ?? "parent").toLowerCase()}`}>
                  {currentUser.role}
                </span>
                <i className={`fas fa-chevron-${dropOpen ? "up" : "down"}`} />
              </button>

              {dropOpen && (
                <>
                  <div className="nav-drop-backdrop" onClick={() => setDropOpen(false)} />
                  <div className="nav-dropdown">
                    <div className="nav-drop-user">
                      <div className="nav-drop-name">{currentUser.first_name} {currentUser.last_name}</div>
                      <div className="nav-drop-email">{currentUser.email}</div>
                    </div>
                    <div className="nav-drop-divider" />

                    {/* Role-based dashboard link */}
                    {currentUser.role === "Parent" && (
                      <button className="nav-drop-item" onClick={() => { setDropOpen(false); handleNav("dashboard"); }}>
                        <i className="fas fa-th-large" /> My Dashboard
                      </button>
                    )}
                    {currentUser.role === "Tutor" && (
                      <button className="nav-drop-item" onClick={() => { setDropOpen(false); handleNav("tutor-dashboard"); }}>
                        <i className="fas fa-th-large" /> My Dashboard
                      </button>
                    )}
                    {currentUser.role === "Admin" && (
                      <button className="nav-drop-item" onClick={() => { setDropOpen(false); handleNav("analytics"); }}>
                        <i className="fas fa-chart-bar" /> Admin Panel
                      </button>
                    )}

                    <div className="nav-drop-divider" />
                    <button className="nav-drop-item danger" onClick={() => { setDropOpen(false); onLogout?.(); }}>
                      <i className="fas fa-sign-out-alt" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <button className="nav-mobile-toggle" onClick={() => setMenuOpen((m) => !m)}>
            <i className={`fas fa-${menuOpen ? "times" : "bars"}`} />
          </button>
        </div>

      </div>
    </nav>
  );
}