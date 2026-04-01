import { useState } from "react";
import type { Tutor, Parent, Booking, Like, Rating, ParentMessage } from "../types";
import QuickStats from "../components/dashboard/QuickStats";
import UpcomingSessions from "../components/dashboard/UpcomingSessions";
import Favorites from "../components/dashboard/Favorites";
import Recommendations from "../components/dashboard/Recommendations";
import ReviewModal from "../components/dashboard/ReviewModal";
import { avatarUrl, formatDate } from "../utils";
import "../components/dashboard/Dashboard.css";

const PERF_COLORS: Record<string, string> = {
  "Excellent":  "#10b981",
  "Good":       "#6366f1",
  "Needs Work": "#f59e0b",
  "Struggling": "#ef4444",
};

const PERF_ICONS: Record<string, string> = {
  "Excellent":  "fa-star",
  "Good":       "fa-thumbs-up",
  "Needs Work": "fa-exclamation-circle",
  "Struggling": "fa-heart-broken",
};

interface Props {
  tutors: Tutor[];
  currentUser: Parent | null;
  bookings: Booking[];
  likes: Like[];
  ratings: Rating[];
  messages: ParentMessage[];
  onNavigateToTutors: () => void;
  onOpenBooking: (tutor: Tutor) => void;
  onViewProfile: (tutor: Tutor) => void;
  onLoginOpen: () => void;
  onCancelBooking: (bookingId: string) => void;
  onAddReview: (rating: Rating) => void;
  onMarkMessageRead: (msgId: string) => void;
}

export default function DashboardPage({
  tutors, currentUser, bookings, likes, ratings, messages,
  onNavigateToTutors, onOpenBooking, onViewProfile, onLoginOpen,
  onCancelBooking, onAddReview, onMarkMessageRead,
}: Props) {

  const [reviewTutor, setReviewTutor] = useState<Tutor | null>(null);

  if (!currentUser) {
    return (
      <div style={{ padding: "5rem 2rem", textAlign: "center" }}>
        <i className="fas fa-lock" style={{ fontSize: "4rem", color: "var(--text3)", marginBottom: "1rem", display: "block" }} />
        <h2 style={{ marginBottom: ".8rem" }}>Login Required</h2>
        <p style={{ color: "var(--text2)", marginBottom: "1.5rem" }}>Please log in to view your dashboard.</p>
        <button className="btn btn-primary" onClick={onLoginOpen}>
          <i className="fas fa-sign-in-alt" /> Login
        </button>
      </div>
    );
  }

  const myReviews = ratings.filter((r) => r.parent_id === currentUser.id);
  const myMessages = messages
    .filter((m) => m.parent_id === currentUser.id)
    .sort((a, b) => b.date - a.date);
  const unreadCount = myMessages.filter((m) => !m.read).length;

  const completedUnreviewed = bookings.filter(
    (b) => b.parent_id === currentUser.id &&
      b.status === "Completed" &&
      !ratings.some((r) => r.parent_id === currentUser.id && r.tutor_id === b.tutor_id)
  );

  const reviewableTutors = Array.from(
    new Map(completedUnreviewed.map((b) => [b.tutor_id, tutors.find((t) => t.id === b.tutor_id)])).entries()
  ).filter(([, t]) => t != null) as [string, Tutor][];

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>My Dashboard</h1>
        <p>Welcome back, {currentUser.full_name.split(" ")[0]}! Here's your overview.</p>
      </div>

      <div className="dash-grid">
        <QuickStats bookings={bookings} likes={likes} parentId={currentUser.id} />

        <UpcomingSessions
          bookings={bookings}
          tutors={tutors}
          parentId={currentUser.id}
          onBookTutor={onNavigateToTutors}
          onCancelBooking={onCancelBooking}
        />

        {/* Progress Reports */}
        <div className="dash-card full">
          <div className="dash-card-title">
            <i className="fas fa-chart-line" /> Child's Progress Reports
            {unreadCount > 0 && (
              <span className="dash-card-count" style={{ background: "#ef4444", color: "#fff" }}>
                {unreadCount} new
              </span>
            )}
            {myMessages.length > 0 && unreadCount === 0 && (
              <span className="dash-card-count">{myMessages.length}</span>
            )}
          </div>

          {myMessages.length === 0 ? (
            <div className="dash-empty">
              <i className="fas fa-chart-line" />
              <p>No progress reports yet. Your tutor will update you after each session.</p>
            </div>
          ) : (
            <div className="pr-list">
              {myMessages.map((msg) => {
                const tutor = tutors.find((t) => t.id === msg.tutor_id);
                const color = PERF_COLORS[msg.performance];
                const icon  = PERF_ICONS[msg.performance];
                return (
                  <div
                    key={msg.id}
                    className={`pr-card ${!msg.read ? "pr-card--unread" : ""}`}
                    onClick={() => !msg.read && onMarkMessageRead(msg.id)}
                  >
                    <div className="pr-accent" style={{ background: color }} />
                    <img src={avatarUrl(tutor?.full_name ?? "T", 80)} alt={tutor?.full_name} className="pr-avatar" />
                    <div className="pr-body">
                      <div className="pr-head">
                        <div className="pr-topic">{msg.topic}</div>
                        <div className="pr-meta-right">
                          <span className="pr-perf-badge" style={{
                            background: color + "18", color, border: `1px solid ${color}44`,
                          }}>
                            <i className={`fas ${icon}`} /> {msg.performance}
                          </span>
                          {!msg.read && <span className="pr-unread-dot" />}
                        </div>
                      </div>
                      <div className="pr-sub-line">
                        <span className="pr-subj-tag">{msg.subject}</span>
                        <span className="pr-tutor-name">
                          <i className="fas fa-chalkboard-teacher" /> {tutor?.full_name ?? "Your Tutor"}
                        </span>
                        <span className="pr-date">
                          {/* Fix: wrap number timestamp with String() */}
                          <i className="fas fa-calendar" /> {formatDate(String(msg.date))}
                        </span>
                      </div>
                      <p className="pr-notes">"{msg.notes}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Favorites
          likes={likes}
          tutors={tutors}
          parentId={currentUser.id}
          onBook={onOpenBooking}
          onViewProfile={onViewProfile}
        />

        {/* My Reviews */}
        <div className="dash-card">
          <div className="dash-card-title">
            <i className="fas fa-star" /> My Reviews
            {myReviews.length > 0 && <span className="dash-card-count">{myReviews.length}</span>}
          </div>

          {reviewableTutors.length > 0 && (
            <div className="rv-prompts">
              {reviewableTutors.map(([, tutor]) => (
                <div key={tutor.id} className="rv-prompt-row">
                  <img src={avatarUrl(tutor.full_name, 60)} alt={tutor.full_name} className="rv-prompt-img" />
                  <div className="rv-prompt-info">
                    <div className="rv-prompt-name">{tutor.full_name}</div>
                    <div className="rv-prompt-sub">How was your session?</div>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => setReviewTutor(tutor)}>
                    <i className="fas fa-star" /> Review
                  </button>
                </div>
              ))}
            </div>
          )}

          {myReviews.length === 0 && reviewableTutors.length === 0 ? (
            <div className="dash-empty">
              <i className="fas fa-star" />
              <p>No reviews yet. Complete a session to leave one!</p>
            </div>
          ) : (
            myReviews.map((r) => {
              const tutor = tutors.find((t) => t.id === r.tutor_id);
              return (
                <div key={r.id} className="rv-card">
                  <div className="rv-card-head">
                    <img src={avatarUrl(tutor?.full_name ?? "T", 60)} alt={tutor?.full_name} className="rv-card-img" />
                    <div className="rv-card-info">
                      <div className="rv-card-name">{tutor?.full_name ?? "Tutor"}</div>
                      <div className="rv-stars-display">
                        {[1,2,3,4,5].map((n) => (
                          <i key={n} className={`fas fa-star ${n <= Math.round(r.rating_score) ? "rv-star-filled" : "rv-star-empty"}`} />
                        ))}
                        <span className="rv-score">{r.rating_score.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="rv-card-text">"{r.review_text}"</p>
                </div>
              );
            })
          )}
        </div>

        {/* Fix: pass parent prop correctly — currentUser is already a Parent type */}
        <Recommendations
          tutors={tutors}
          parent={currentUser}
          onBook={onOpenBooking}
          onViewProfile={onViewProfile}
        />
      </div>

      {reviewTutor && (
        <ReviewModal
          tutor={reviewTutor}
          parentId={currentUser.id}
          onClose={() => setReviewTutor(null)}
          onSubmit={(rating) => { onAddReview(rating); setReviewTutor(null); }}
        />
      )}
    </div>
  );
}