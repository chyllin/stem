import { useState, useCallback, useEffect } from "react";
import type { Page, CurrentUser, Notification } from "./types";
import type { Parent, Tutor, Booking, Like, Rating, ProgressEntry, ParentMessage } from "./types";
import type { ApiUser } from "./types";
import { fetchMe } from "./api/index";

import Navbar         from "./components/layout/Navbar";
import Footer         from "./components/layout/Footer";
import NotifToast     from "./components/layout/NotifToast";
import HomePage       from "./pages/HomePage";
import LoginPage      from "./pages/LoginPage";
import RegisterPage   from "./pages/RegisterPage";
import TutorsPage     from "./pages/Tutors";
import DashboardPage  from "./pages/Dashboard";
import TutorDashboard from "./pages/TutorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Analytics      from "./pages/Analytics";
import About          from "./pages/About";

import "./index.css";

import { TUTORS, PARENTS, BOOKINGS, RATINGS, LIKES, PROGRESS } from "./data";

// ── Helpers ────────────────────────────────────────────────────────────────────

function apiUserToCurrentUser(apiUser: ApiUser): CurrentUser {
  return {
    id:           apiUser.id,
    username:     apiUser.username,
    email:        apiUser.email,
    first_name:   apiUser.first_name   ?? apiUser.username,
    last_name:    apiUser.last_name    ?? "",
    full_name:    `${apiUser.first_name ?? apiUser.username} ${apiUser.last_name ?? ""}`.trim(),
    phone_number: apiUser.phone_number ?? "",
    location:     apiUser.location     ?? "",
    role:         apiUser.role,
    is_verified:  apiUser.is_verified,
    is_active:    apiUser.is_active,
  };
}

function currentUserToParent(user: CurrentUser): Parent {
  return {
    id:              user.id,
    full_name:       user.full_name,
    email:           user.email,
    location:        user.location,
    subjects_needed: user.subjects_needed ?? [],
    child_grade:     user.child_grade     ?? "",
    total_bookings:  0,
    role:            "parent",
  };
}

function redirectForRole(role: string): Page {
  if (role === "Tutor") return "tutor-dashboard";
  if (role === "Admin") return "analytics";
  return "tutors";
}

const NO_FOOTER_PAGES: Page[] = ["login", "register"];

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  const [page,        setPage]        = useState<Page>("home");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [notif,       setNotif]       = useState<Notification | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);

  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);
  const [likes,    setLikes]    = useState<Like[]>(LIKES);
  const [ratings,  setRatings]  = useState<Rating[]>(RATINGS);
  const [progress, setProgress] = useState<ProgressEntry[]>(PROGRESS);
  const [messages]              = useState<ParentMessage[]>([]);

  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(() => setNotif(null), 4500);
    return () => clearTimeout(t);
  }, [notif]);

  useEffect(() => {
    fetchMe()
      .then((apiUser) => setCurrentUser(apiUserToCurrentUser(apiUser)))
      .catch(() => setCurrentUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const showNotif = useCallback((message: string, type: Notification["type"] = "info") => {
    setNotif({ message, type });
  }, []);

  const navigate = useCallback((p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BASE_URL}/users/logout/`, {
        method: "POST", credentials: "include",
      });
    } catch { /* ignore */ }
    setCurrentUser(null);
    showNotif("Logged out successfully.", "info");
    navigate("home");
  };

  const handleRegisterSuccess = (username: string) => {
    showNotif(`Account created for @${username}! Please sign in to continue. 🎉`, "success");
    navigate("login");
  };

  const handleLoginSuccess = (apiUser: ApiUser) => {
    const user = apiUserToCurrentUser(apiUser);
    setCurrentUser(user);
    showNotif(`Welcome back, ${user.first_name || user.username}! 👋`, "success");
    navigate(redirectForRole(user.role));
  };

  // ── Data handlers ─────────────────────────────────────────────────────────

  const handleToggleLike = (tutorId: string) => {
    if (!currentUser) return;
    setLikes((prev) => {
      const existing = prev.find((l) => l.tutor_id === tutorId && l.parent_id === currentUser.id);
      if (existing) return prev.map((l) => l.id === existing.id ? { ...l, liked: !l.liked } : l);
      return [...prev, { id: `l${Date.now()}`, tutor_id: tutorId, parent_id: currentUser.id, liked: true }];
    });
  };

  const handleOpenBooking    = (_tutor: Tutor) => showNotif("Booking coming soon — API integration in progress.", "info");
  const handleCancelBooking  = (id: string)    => { setBookings((p) => p.map((b) => b.id === id ? { ...b, status: "Cancelled" } : b)); showNotif("Booking cancelled.", "info"); };
  const handleAcceptBooking  = (id: string)    => { setBookings((p) => p.map((b) => b.id === id ? { ...b, status: "Confirmed" } : b)); showNotif("Booking accepted.", "success"); };
  const handleDeclineBooking = (id: string)    => { setBookings((p) => p.map((b) => b.id === id ? { ...b, status: "Cancelled" } : b)); showNotif("Booking declined.", "info"); };
  const handleCompleteBooking= (id: string)    => { setBookings((p) => p.map((b) => b.id === id ? { ...b, status: "Completed" } : b)); showNotif("Session marked complete!", "success"); };

  const handleAddReview      = (rating: Rating)      => { setRatings((p) => [...p, rating]); showNotif("Review submitted! Thank you.", "success"); };
  const handleAddProgress    = (entry: ProgressEntry) => setProgress((p) => [...p, entry]);
  const handleUpdateProgress = (entry: ProgressEntry) => setProgress((p) => p.map((e) => e.id === entry.id ? entry : e));
  const handleDeleteProgress = (id: string)           => setProgress((p) => p.filter((e) => e.id !== id));

  const parentUser = currentUser ? currentUserToParent(currentUser) : null;

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "var(--bg)",
      }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--p)" }} />
      </div>
    );
  }

  return (
    <>
      {notif && <NotifToast notif={notif} />}

      <Navbar
        currentPage={page}
        currentUser={currentUser}
        onNavigate={navigate}
        onLogout={handleLogout}
      />

      <main>
        {page === "home"     && <HomePage onNavigate={navigate} />}
        {page === "about"    && <About />}
        {page === "login"    && <LoginPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />}
        {page === "register" && <RegisterPage onRegisterSuccess={handleRegisterSuccess} onNavigate={navigate} />}

        {page === "tutors" && (
          <TutorsPage
            tutors={TUTORS}
            currentUser={parentUser}
            likes={likes}
            ratings={ratings}
            onToggleLike={handleToggleLike}
            onOpenBooking={handleOpenBooking}
            onLoginRequired={() => navigate("login")}
          />
        )}

        {page === "dashboard" && (
          <DashboardPage
            tutors={TUTORS}
            currentUser={parentUser}
            bookings={bookings}
            likes={likes}
            ratings={ratings}
            messages={messages}
            onNavigateToTutors={() => navigate("tutors")}
            onOpenBooking={handleOpenBooking}
            onViewProfile={() => navigate("tutors")}
            onLoginOpen={() => navigate("login")}
            onCancelBooking={handleCancelBooking}
            onAddReview={handleAddReview}
            onMarkMessageRead={() => {}}
          />
        )}

        {page === "tutor-dashboard" && (
          <TutorDashboard
            tutors={TUTORS}
            currentUser={parentUser}
            bookings={bookings}
            ratings={ratings}
            progress={progress}
            parents={PARENTS}
            onLoginOpen={() => navigate("login")}
            onAcceptBooking={handleAcceptBooking}
            onDeclineBooking={handleDeclineBooking}
            onCompleteBooking={handleCompleteBooking}
            onAddProgress={handleAddProgress}
            onUpdateProgress={handleUpdateProgress}
            onDeleteProgress={handleDeleteProgress}
          />
        )}

        {/* Analytics — charts overview for Admin */}
        {page === "analytics" && (
          <Analytics
            tutors={TUTORS}
            parents={PARENTS}
            bookings={bookings}
            ratings={ratings}
            progress={progress}
          />
        )}

        {/* Admin dashboard — full user/booking management for Admin */}
        {page === "admin" && (
          <AdminDashboard
            tutors={TUTORS}
            parents={PARENTS}
            bookings={bookings}
            ratings={ratings}
            progress={progress}
          />
        )}
      </main>

      {!NO_FOOTER_PAGES.includes(page) && (
        <Footer onNavigate={navigate} onRegisterOpen={() => navigate("register")} />
      )}
    </>
  );
}