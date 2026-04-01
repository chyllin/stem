import { useState } from "react";
import type { Tutor, Parent, Booking } from "../../types";
import { avatarUrl, todayStr } from "../../utils";
import Modal from "./Modal";

interface Props {
  tutor: Tutor;
  currentUser: Parent;
  onClose: () => void;
  onConfirm: (booking: Booking) => void;
}

export default function BookingModal({ tutor, currentUser, onClose, onConfirm }: Props) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    tutor.subjects.length === 1 ? [tutor.subjects[0]] : []
  );
  const [date,     setDate]     = useState("");
  const [time,     setTime]     = useState("");
  const [duration, setDuration] = useState("1");
  const [location, setLocation] = useState("");
  const [notes,    setNotes]    = useState("");

  const totalCost = tutor.hourly_rate * parseFloat(duration);

  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubjects.length === 0) return;
    const booking: Booking = {
      id: `b_${Date.now()}`,
      parent_id: currentUser.id,
      tutor_id: tutor.id,
      subjects: selectedSubjects,
      session_date: new Date(`${date}T${time}`).getTime(),
      duration_hours: parseFloat(duration),
      status: "Pending",
      location,
      notes,
      total_cost: totalCost,
    };
    onConfirm(booking);
    onClose();
  };

  const multiSubject = tutor.subjects.length > 1;

  return (
    <Modal onClose={onClose} size="sm" title="Book a Session" titleIcon="fa-calendar-check">

      {/* Tutor mini header */}
      <div className="bk-tutor-row">
        <img src={avatarUrl(tutor.full_name, 80)} alt={tutor.full_name} className="bk-tutor-img" />
        <div>
          <div className="bk-tutor-name">{tutor.full_name}</div>
          <div className="bk-tutor-meta">
            <i className="fas fa-map-marker-alt" /> {tutor.location} &nbsp;·&nbsp;
            <i className="fas fa-money-bill-wave" /> GHS {tutor.hourly_rate}/hr
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Subject selection */}
        <div className="form-group">
          <label>
            {multiSubject
              ? <>Subject(s) <span className="bk-label-hint">— select all that apply</span></>
              : "Subject"}
          </label>

          {multiSubject ? (
            <>
              <div className="bk-subject-grid">
                {tutor.subjects.map((s) => {
                  const active = selectedSubjects.includes(s);
                  return (
                    <button
                      type="button"
                      key={s}
                      className={`bk-subject-chip ${active ? "active" : ""}`}
                      onClick={() => toggleSubject(s)}
                    >
                      <i className={`fas ${active ? "fa-check-circle" : "fa-circle"}`} />
                      {s}
                    </button>
                  );
                })}
              </div>
              {selectedSubjects.length === 0 && (
                <p className="bk-subject-error">Please select at least one subject.</p>
              )}
            </>
          ) : (
            <input type="text" readOnly value={tutor.subjects[0]} />
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label>Date</label>
            <input type="date" required min={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Duration</label>
          <select value={duration} onChange={(e) => setDuration(e.target.value)}>
            {[["1","1 hour"],["1.5","1.5 hours"],["2","2 hours"],["3","3 hours"]].map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input type="text" required placeholder="Session address" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea rows={2} placeholder="Topics to focus on…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {/* Cost summary */}
        <div className="bk-summary">
          <div className="bk-row">
            <span>Subject(s)</span>
            <span>{selectedSubjects.length > 0 ? selectedSubjects.join(", ") : "—"}</span>
          </div>
          <div className="bk-row"><span>Hourly Rate</span><span>GHS {tutor.hourly_rate}</span></div>
          <div className="bk-row"><span>Duration</span><span>{duration} hour(s)</span></div>
          <div className="bk-row bk-row--total"><span>Total Cost</span><span>GHS {totalCost.toFixed(0)}</span></div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          style={{ marginTop: ".5rem" }}
          disabled={selectedSubjects.length === 0}
        >
          <i className="fas fa-check" /> Confirm Booking
        </button>
      </form>
    </Modal>
  );
}