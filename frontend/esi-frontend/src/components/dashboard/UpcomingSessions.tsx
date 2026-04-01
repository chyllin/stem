import type { Booking, Tutor } from "../../types";
import { formatDate, formatTime, avatarUrl } from "../../utils";
import "./Dashboard.css";

interface Props {
  bookings: Booking[];
  tutors: Tutor[];
  parentId: string;
  onBookTutor: () => void;
  onCancelBooking: (bookingId: string) => void;
}

export default function UpcomingSessions({ bookings, tutors, parentId, onBookTutor, onCancelBooking }: Props) {
  const upcoming = bookings
    .filter((b) => b.parent_id === parentId && b.status !== "Cancelled" && b.session_date > Date.now())
    .slice(0, 5);

  return (
    <div className="dash-card full">
      <div className="dash-card-title">
        <i className="fas fa-calendar-alt" /> Upcoming Sessions
        <span className="dash-card-count">{upcoming.length}</span>
      </div>

      {upcoming.length === 0 ? (
        <div className="dash-empty">
          <i className="fas fa-calendar-plus" />
          <p>No upcoming sessions.</p>
          <button className="btn btn-primary btn-sm" onClick={onBookTutor}>Find a Tutor</button>
        </div>
      ) : (
        <div className="sess-list">
          {upcoming.map((b) => {
            const tutor = tutors.find((t) => t.id === b.tutor_id);
            const isPending = b.status === "Pending";

            return (
              <div key={b.id} className="sess-item">
                <div className="sess-avatar">
                  <img src={avatarUrl(tutor?.full_name ?? "T", 80)} alt={tutor?.full_name} />
                </div>
                <div className="sess-info">
                  <div className="sess-head">
                    <div>
                      <div className="sess-tutor">{tutor?.full_name ?? "Unknown Tutor"}</div>
                      <div className="sess-subj"><i className="fas fa-book" /> {b.subjects.join(", ")}</div>
                    </div>
                    <span className={`status-badge status-${b.status.toLowerCase()}`}>{b.status}</span>
                  </div>
                  <div className="sess-meta">
                    <span><i className="fas fa-calendar" /> {formatDate(String(b.session_date))} at {formatTime(String(b.session_date))}</span>
                    <span><i className="fas fa-map-marker-alt" /> {b.location}</span>
                    <span><i className="fas fa-clock" /> {b.duration_hours}h · GHS {b.total_cost}</span>
                  </div>
                </div>

                {isPending && (
                  <button
                    className="sess-cancel-btn"
                    onClick={() => {
                      if (confirm("Cancel this booking request?")) {
                        onCancelBooking(b.id);
                      }
                    }}
                    title="Cancel booking"
                  >
                    <i className="fas fa-times" /> Cancel
                  </button>
                )}

                {b.status === "Confirmed" && (
                  <div className="sess-confirmed-hint">
                    <i className="fas fa-lock" /> Confirmed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}