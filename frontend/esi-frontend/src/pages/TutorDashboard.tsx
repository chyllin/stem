import { useState } from "react";
import type { Tutor, Parent, Booking, Rating, ProgressEntry } from "../types";
import { avatarUrl, formatDate, formatTime } from "../utils";
import "../components/dashboard/Dashboard.css";

interface Props {
  tutors: Tutor[];
  currentUser: Parent | null;
  bookings: Booking[];
  ratings: Rating[];
  progress: ProgressEntry[];
  parents: Parent[];
  onLoginOpen: () => void;
  onAcceptBooking: (id: string) => void;
  onDeclineBooking: (id: string) => void;
  onCompleteBooking: (id: string) => void;
  onAddProgress: (entry: ProgressEntry) => void;
  onUpdateProgress: (entry: ProgressEntry) => void;
  onDeleteProgress: (id: string) => void;
}

const PERF_COLORS: Record<string, string> = {
  "Excellent":   "#10b981",
  "Good":        "#6366f1",
  "Needs Work":  "#f59e0b",
  "Struggling":  "#ef4444",
};

export default function TutorDashboard({
  tutors, currentUser, bookings, ratings, progress, parents,
  onLoginOpen, onAcceptBooking, onDeclineBooking, onCompleteBooking,
  onAddProgress, onUpdateProgress, onDeleteProgress,
}: Props) {

  const [activeTab,     setActiveTab]     = useState<"requests" | "upcoming" | "history" | "students" | "analytics">("requests");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [editingEntry,  setEditingEntry]  = useState<ProgressEntry | null>(null);

  const [pfSubject,  setPfSubject]  = useState("");
  const [pfTopic,    setPfTopic]    = useState("");
  const [pfPerf,     setPfPerf]     = useState<ProgressEntry["performance"]>("Good");
  const [pfNotes,    setPfNotes]    = useState("");

  if (!currentUser) {
    return (
      <div style={{ padding: "5rem 2rem", textAlign: "center" }}>
        <i className="fas fa-lock" style={{ fontSize: "4rem", color: "var(--text3)", marginBottom: "1rem", display: "block" }} />
        <h2 style={{ marginBottom: ".8rem" }}>Login Required</h2>
        <p style={{ color: "var(--text2)", marginBottom: "1.5rem" }}>Please log in to view your tutor dashboard.</p>
        <button className="btn btn-primary" onClick={onLoginOpen}><i className="fas fa-sign-in-alt" /> Login</button>
      </div>
    );
  }

  const myProfile = tutors.find((t) => t.id === currentUser.id);
  const myBookings = bookings.filter((b) => b.tutor_id === currentUser.id);
  const pendingRequests  = myBookings.filter((b) => b.status === "Pending");
  const upcomingSessions = myBookings.filter((b) => b.status === "Confirmed" && b.session_date > Date.now());
  const history          = myBookings.filter((b) => b.status === "Completed" || b.status === "Cancelled");
  const myReviews        = ratings.filter((r) => r.tutor_id === currentUser.id);
  const avgRating        = myReviews.length > 0
    ? (myReviews.reduce((s, r) => s + r.rating_score, 0) / myReviews.length).toFixed(1)
    : myProfile?.average_rating.toFixed(1) ?? "—";
  const totalEarned = myBookings.filter((b) => b.status === "Completed").reduce((s, b) => s + b.total_cost, 0);

  const studentIds = [...new Set(
    myBookings.filter((b) => b.status === "Completed" || b.status === "Confirmed").map((b) => b.parent_id)
  )];
  const myStudents = parents.filter((p) => studentIds.includes(p.id));

  const tabs = [
    { key: "requests",  label: "Requests",  icon: "fa-bell",           count: pendingRequests.length },
    { key: "upcoming",  label: "Upcoming",  icon: "fa-calendar-check", count: upcomingSessions.length },
    { key: "students",  label: "Students",  icon: "fa-users",          count: myStudents.length },
    { key: "history",   label: "History",   icon: "fa-history",        count: history.length },
    { key: "analytics", label: "Analytics", icon: "fa-chart-bar",      count: 0 },
  ] as const;

  const openAddForm = (parentId: string) => {
    setEditingEntry(null);
    setSelectedStudent(parentId);
    setPfSubject(myProfile?.subjects[0] ?? "");
    setPfTopic(""); setPfPerf("Good"); setPfNotes("");
    setShowProgressForm(true);
  };

  const openEditForm = (entry: ProgressEntry) => {
    setEditingEntry(entry);
    setSelectedStudent(entry.parent_id);
    setPfSubject(entry.subject);
    setPfTopic(entry.topic);
    setPfPerf(entry.performance);
    setPfNotes(entry.notes);
    setShowProgressForm(true);
  };

  const handleSubmitProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pfTopic.trim() || !pfNotes.trim()) return;
    if (editingEntry) {
      onUpdateProgress({ ...editingEntry, subject: pfSubject, topic: pfTopic, performance: pfPerf, notes: pfNotes });
    } else {
      onAddProgress({
        id: `pr_${Date.now()}`,
        tutor_id: currentUser.id,
        parent_id: selectedStudent!,
        subject: pfSubject,
        date: Date.now(),
        topic: pfTopic,
        performance: pfPerf,
        notes: pfNotes,
      });
    }
    setShowProgressForm(false);
  };

  const studentProgress = (parentId: string) =>
    progress.filter((p) => p.tutor_id === currentUser.id && p.parent_id === parentId)
      .sort((a, b) => b.date - a.date);

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Tutor Dashboard</h1>
        <p>Welcome back, {currentUser.full_name.split(" ")[0]}! Manage your sessions here.</p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>

        <div className="td-profile-card">
          <div className="td-profile-left">
            <img src={avatarUrl(currentUser.full_name, 120)} alt={currentUser.full_name} className="td-profile-avatar" />
            <div className="td-profile-info">
              <div className="td-profile-name">
                {currentUser.full_name}
                {myProfile?.verified && <span className="verified-badge"><i className="fas fa-check" /> Verified</span>}
              </div>
              <div className="td-profile-meta">
                <span><i className="fas fa-map-marker-alt" /> {myProfile?.location ?? currentUser.location}</span>
                <span><i className="fas fa-book" /> {myProfile?.subjects.join(", ") ?? "—"}</span>
                <span><i className="fas fa-money-bill-wave" /> GHS {myProfile?.hourly_rate ?? "—"}/hr</span>
              </div>
              <p className="td-profile-bio">{myProfile?.bio ?? "No bio yet."}</p>
            </div>
          </div>
          <div className="td-stats-strip">
            {[
              { icon: "fa-calendar-check", val: myProfile?.total_sessions ?? 0,        label: "Total Sessions" },
              { icon: "fa-star",           val: avgRating,                              label: "Avg Rating" },
              { icon: "fa-check-circle",   val: `${myProfile?.completion_rate ?? 0}%`, label: "Completion" },
              { icon: "fa-money-bill",     val: `GHS ${totalEarned}`,                  label: "Earned" },
            ].map((s) => (
              <div key={s.label} className="td-stat-item">
                <i className={`fas ${s.icon}`} />
                <span className="td-stat-val">{s.val}</span>
                <span className="td-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="td-main">
          <div className="td-bookings-col">

            <div className="td-tabs">
              {tabs.map((t) => (
                <button key={t.key} className={`td-tab ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
                  <i className={`fas ${t.icon}`} /> {t.label}
                  {t.count > 0 && <span className="td-tab-badge">{t.count}</span>}
                </button>
              ))}
            </div>

            {activeTab === "requests" && (
              <div className="td-list">
                {pendingRequests.length === 0 ? (
                  <div className="dash-empty"><i className="fas fa-bell-slash" /><p>No pending booking requests.</p></div>
                ) : pendingRequests.map((b) => (
                  <BookingCard key={b.id} booking={b} type="request"
                    onAccept={() => onAcceptBooking(b.id)} onDecline={() => onDeclineBooking(b.id)} />
                ))}
              </div>
            )}

            {activeTab === "upcoming" && (
              <div className="td-list">
                {upcomingSessions.length === 0 ? (
                  <div className="dash-empty"><i className="fas fa-calendar" /><p>No upcoming confirmed sessions.</p></div>
                ) : upcomingSessions.map((b) => (
                  <BookingCard key={b.id} booking={b} type="upcoming" onComplete={() => onCompleteBooking(b.id)} />
                ))}
              </div>
            )}

            {activeTab === "students" && (
              <div>
                {myStudents.length === 0 ? (
                  <div className="dash-empty">
                    <i className="fas fa-users" />
                    <p>No students yet. Complete sessions to track student progress.</p>
                  </div>
                ) : myStudents.map((student) => {
                  const entries = studentProgress(student.id);
                  const lastPerf = entries[0]?.performance;
                  const sessionCount = myBookings.filter(
                    (b) => b.parent_id === student.id && (b.status === "Completed" || b.status === "Confirmed")
                  ).length;

                  return (
                    <div key={student.id} className="sp-student-card">
                      <div className="sp-student-head">
                        <img src={avatarUrl(student.full_name, 80)} alt={student.full_name} className="sp-student-avatar" />
                        <div className="sp-student-info">
                          <div className="sp-student-name">{student.full_name}</div>
                          <div className="sp-student-meta">
                            <span><i className="fas fa-graduation-cap" /> {student.child_grade}</span>
                            <span><i className="fas fa-calendar-check" /> {sessionCount} session{sessionCount !== 1 ? "s" : ""}</span>
                            {lastPerf && (
                              <span className="sp-perf-badge" style={{ background: PERF_COLORS[lastPerf] + "22", color: PERF_COLORS[lastPerf], border: `1px solid ${PERF_COLORS[lastPerf]}44` }}>
                                Latest: {lastPerf}
                              </span>
                            )}
                          </div>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => openAddForm(student.id)}>
                          <i className="fas fa-plus" /> Add Entry
                        </button>
                      </div>

                      {entries.length === 0 ? (
                        <p className="sp-no-entries">No progress entries yet. Click "Add Entry" after each session.</p>
                      ) : (
                        <div className="sp-entries">
                          {entries.map((entry) => (
                            <div key={entry.id} className="sp-entry">
                              <div className="sp-entry-left">
                                <div className="sp-perf-dot" style={{ background: PERF_COLORS[entry.performance] }} />
                              </div>
                              <div className="sp-entry-body">
                                <div className="sp-entry-head">
                                  <div className="sp-entry-topic">{entry.topic}</div>
                                  <span className="sp-entry-subj">{entry.subject}</span>
                                </div>
                                <p className="sp-entry-notes">{entry.notes}</p>
                                <div className="sp-entry-footer">
                                  {/* Fix: wrap number timestamp with String() */}
                                  <span className="sp-entry-date"><i className="fas fa-calendar" /> {formatDate(String(entry.date))}</span>
                                  <span className="sp-perf-badge" style={{ background: PERF_COLORS[entry.performance] + "22", color: PERF_COLORS[entry.performance], border: `1px solid ${PERF_COLORS[entry.performance]}44` }}>
                                    {entry.performance}
                                  </span>
                                </div>
                              </div>
                              <div className="sp-entry-actions">
                                <button className="sp-icon-btn" title="Edit" onClick={() => openEditForm(entry)}>
                                  <i className="fas fa-edit" />
                                </button>
                                <button className="sp-icon-btn danger" title="Delete" onClick={() => onDeleteProgress(entry.id)}>
                                  <i className="fas fa-trash" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "history" && (
              <div className="td-list">
                {history.length === 0 ? (
                  <div className="dash-empty"><i className="fas fa-history" /><p>No session history yet.</p></div>
                ) : history.map((b) => (
                  <BookingCard key={b.id} booking={b} type="history" />
                ))}
              </div>
            )}

            {activeTab === "analytics" && (
              <TutorAnalytics
                myBookings={myBookings}
                myStudents={myStudents}
                myReviews={myReviews}
                progress={progress.filter((p) => p.tutor_id === currentUser.id)}
                totalEarned={totalEarned}
              />
            )}
          </div>

          <div className="td-reviews-col">
            <div className="dash-card">
              <div className="dash-card-title">
                <i className="fas fa-star" /> My Reviews
                {myReviews.length > 0 && <span className="dash-card-count">{myReviews.length}</span>}
              </div>
              {myReviews.length === 0 ? (
                <div className="dash-empty" style={{ padding: "1.5rem 0" }}>
                  <i className="fas fa-star" />
                  <p>No reviews yet. Complete sessions to receive reviews.</p>
                </div>
              ) : myReviews.map((r) => (
                <div key={r.id} className="rv-card">
                  <div className="rv-card-head">
                    <i className="fas fa-user-circle" style={{ fontSize: "2rem", color: "var(--text3)" }} />
                    <div>
                      <div className="rv-card-name">Parent Review</div>
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
              ))}
            </div>
          </div>
        </div>
      </div>

      {showProgressForm && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowProgressForm(false)}>
          <div className="modal-box sm" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowProgressForm(false)}><i className="fas fa-times" /></button>

            <div className="sp-modal-head">
              <div className="sp-modal-icon"><i className="fas fa-chart-line" /></div>
              <div>
                <div className="sp-modal-title">{editingEntry ? "Edit Progress Entry" : "Add Progress Entry"}</div>
                <div className="sp-modal-sub">
                  {parents.find((p) => p.id === selectedStudent)?.full_name}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitProgress}>
              <div className="form-group">
                <label><i className="fas fa-book" /> Subject</label>
                <select value={pfSubject} onChange={(e) => setPfSubject(e.target.value)} required>
                  {(myProfile?.subjects ?? []).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label><i className="fas fa-pen" /> Topic Covered</label>
                <input type="text" placeholder="e.g. Algebra — Linear Equations" value={pfTopic}
                  onChange={(e) => setPfTopic(e.target.value)} required />
              </div>

              <div className="form-group">
                <label><i className="fas fa-chart-bar" /> Performance</label>
                <div className="sp-perf-grid">
                  {(["Excellent", "Good", "Needs Work", "Struggling"] as const).map((p) => (
                    <button key={p} type="button"
                      className={`sp-perf-btn ${pfPerf === p ? "active" : ""}`}
                      style={pfPerf === p ? { borderColor: PERF_COLORS[p], background: PERF_COLORS[p], color: "#fff" } : { borderColor: PERF_COLORS[p] + "55", color: PERF_COLORS[p] }}
                      onClick={() => setPfPerf(p)}
                    >
                      <span className="sp-perf-dot-sm" style={{ background: PERF_COLORS[p] }} />
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label><i className="fas fa-comment" /> Tutor Notes</label>
                <textarea rows={3} placeholder="Describe what the student did well, what needs improvement…"
                  value={pfNotes} onChange={(e) => setPfNotes(e.target.value)} required />
              </div>

              <div style={{ display: "flex", gap: ".75rem" }}>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowProgressForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-block">
                  <i className="fas fa-save" /> {editingEntry ? "Update" : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TutorAnalytics({ myBookings, myStudents, myReviews, progress, totalEarned }: {
  myBookings: Booking[];
  myStudents: Parent[];
  myReviews: Rating[];
  progress: ProgressEntry[];
  totalEarned: number;
}) {
  const completed  = myBookings.filter((b) => b.status === "Completed");
  const completion = myBookings.length > 0 ? Math.round((completed.length / myBookings.length) * 100) : 0;

  const subjectMap: Record<string, number> = {};
  myBookings.filter((b) => b.status === "Completed").forEach((b) =>
    b.subjects.forEach((s) => { subjectMap[s] = (subjectMap[s] ?? 0) + 1; })
  );
  const subjectData = Object.entries(subjectMap).sort((a, b) => b[1] - a[1]);
  const maxSubj = Math.max(...subjectData.map((s) => s[1]), 1);

  const perfMap: Record<string, number> = { Excellent: 0, Good: 0, "Needs Work": 0, Struggling: 0 };
  progress.forEach((p) => { perfMap[p.performance] = (perfMap[p.performance] ?? 0) + 1; });
  const totalPerf = progress.length || 1;

  const PERF_COLORS: Record<string, string> = {
    "Excellent":  "#10b981",
    "Good":       "#6366f1",
    "Needs Work": "#f59e0b",
    "Struggling": "#ef4444",
  };

  const earningsMap: Record<string, number> = {};
  myBookings.filter((b) => b.status === "Completed").forEach((b) =>
    b.subjects.forEach((s) => { earningsMap[s] = (earningsMap[s] ?? 0) + b.total_cost / b.subjects.length; })
  );

  const studentSessions = myStudents.map((s) => ({
    name: s.full_name,
    grade: s.child_grade,
    sessions: myBookings.filter((b) => b.parent_id === s.id && b.status === "Completed").length,
    progress: progress.filter((p) => p.parent_id === s.id).length,
    lastPerf: progress.filter((p) => p.parent_id === s.id).sort((a, b) => b.date - a.date)[0]?.performance,
  }));

  const statRow = [
    { icon: "fa-calendar-check", label: "Total Sessions",  val: myBookings.length,           color: "#6366f1" },
    { icon: "fa-check-circle",   label: "Completed",       val: completed.length,            color: "#10b981" },
    { icon: "fa-percentage",     label: "Completion Rate", val: `${completion}%`,            color: "#8b5cf6" },
    { icon: "fa-money-bill",     label: "Total Earned",    val: `GHS ${totalEarned}`,        color: "#14b8a6" },
    { icon: "fa-star",           label: "Avg Rating",      val: myReviews.length ? (myReviews.reduce((s, r) => s + r.rating_score, 0) / myReviews.length).toFixed(1) : "—", color: "#ec4899" },
    { icon: "fa-users",          label: "Students",        val: myStudents.length,           color: "#f59e0b" },
  ];

  return (
    <div className="ta-wrap">
      <div className="ta-stat-row">
        {statRow.map((s) => (
          <div key={s.label} className="ta-stat-card">
            <div className="ta-stat-icon" style={{ color: s.color, background: s.color + "18" }}>
              <i className={`fas ${s.icon}`} />
            </div>
            <div className="ta-stat-val">{s.val}</div>
            <div className="ta-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="ta-grid">
        <div className="dash-card">
          <div className="dash-card-title"><i className="fas fa-book" /> Sessions by Subject</div>
          {subjectData.length === 0 ? (
            <div className="dash-empty" style={{ padding: "1rem 0" }}><i className="fas fa-book" /><p>No completed sessions yet.</p></div>
          ) : (
            <div className="ta-bars">
              {subjectData.map(([subj, count]) => (
                <div key={subj} className="ta-bar-row">
                  <div className="ta-bar-label">{subj}</div>
                  <div className="ta-bar-track">
                    <div className="ta-bar-fill" style={{ width: `${(count / maxSubj) * 100}%` }} />
                  </div>
                  <div className="ta-bar-val">{count} session{count !== 1 ? "s" : ""}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-title"><i className="fas fa-chart-pie" /> Student Performance</div>
          {progress.length === 0 ? (
            <div className="dash-empty" style={{ padding: "1rem 0" }}><i className="fas fa-chart-pie" /><p>No progress entries yet.</p></div>
          ) : (
            <>
              <div className="ta-perf-bars">
                {Object.entries(perfMap).map(([perf, count]) => (
                  <div key={perf} className="ta-perf-row">
                    <div className="ta-perf-label">
                      <span className="ta-perf-dot" style={{ background: PERF_COLORS[perf] }} />
                      {perf}
                    </div>
                    <div className="ta-bar-track">
                      <div className="ta-bar-fill" style={{ width: `${(count / totalPerf) * 100}%`, background: PERF_COLORS[perf] }} />
                    </div>
                    <div className="ta-perf-count" style={{ color: PERF_COLORS[perf] }}>{count}</div>
                  </div>
                ))}
              </div>
              <div className="ta-perf-total">{progress.length} total progress entries across {myStudents.length} student{myStudents.length !== 1 ? "s" : ""}</div>
            </>
          )}
        </div>

        <div className="dash-card ta-full">
          <div className="dash-card-title"><i className="fas fa-users" /> Student Summary</div>
          {studentSessions.length === 0 ? (
            <div className="dash-empty" style={{ padding: "1rem 0" }}><i className="fas fa-users" /><p>No students yet.</p></div>
          ) : (
            <table className="ta-table">
              <thead>
                <tr>
                  <th>Student</th><th>Grade</th><th>Sessions</th><th>Progress Logs</th><th>Latest Performance</th>
                </tr>
              </thead>
              <tbody>
                {studentSessions.map((s) => (
                  <tr key={s.name}>
                    <td className="ta-td-name">{s.name}</td>
                    <td className="ta-muted">{s.grade}</td>
                    <td className="ta-bold">{s.sessions}</td>
                    <td className="ta-bold">{s.progress}</td>
                    <td>
                      {s.lastPerf ? (
                        <span className="ta-perf-pill" style={{
                          background: PERF_COLORS[s.lastPerf] + "18",
                          color: PERF_COLORS[s.lastPerf],
                          border: `1px solid ${PERF_COLORS[s.lastPerf]}44`,
                        }}>
                          {s.lastPerf}
                        </span>
                      ) : <span className="ta-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {Object.keys(earningsMap).length > 0 && (
          <div className="dash-card ta-full">
            <div className="dash-card-title"><i className="fas fa-money-bill-wave" /> Earnings by Subject</div>
            <div className="ta-earnings-grid">
              {Object.entries(earningsMap).map(([subj, amt]) => (
                <div key={subj} className="ta-earnings-card">
                  <div className="ta-earnings-subj">{subj}</div>
                  <div className="ta-earnings-amt">GHS {Math.round(amt)}</div>
                  <div className="ta-earnings-pct">{Math.round((amt / totalEarned) * 100)}% of total</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking: b, type, onAccept, onDecline, onComplete }: {
  booking: Booking;
  type: "request" | "upcoming" | "history";
  onAccept?: () => void;
  onDecline?: () => void;
  onComplete?: () => void;
}) {
  return (
    <div className={`td-booking-card td-booking-${b.status.toLowerCase()}`}>
      <div className="td-booking-head">
        <div className="td-booking-icon">
          <i className={`fas ${b.status === "Pending" ? "fa-clock" : b.status === "Confirmed" ? "fa-check-circle" : b.status === "Completed" ? "fa-star" : "fa-times-circle"}`} />
        </div>
        <div className="td-booking-info">
          <div className="td-booking-subj">{b.subjects.join(", ")}</div>
          <div className="td-booking-meta">
            {/* Fix: wrap number timestamp with String() */}
            <span><i className="fas fa-calendar" /> {formatDate(String(b.session_date))} at {formatTime(String(b.session_date))}</span>
            <span><i className="fas fa-clock" /> {b.duration_hours}h</span>
            <span><i className="fas fa-map-marker-alt" /> {b.location}</span>
          </div>
        </div>
        <div className="td-booking-right">
          <span className={`status-badge status-${b.status.toLowerCase()}`}>{b.status}</span>
          <div className="td-booking-earn">GHS {b.total_cost}</div>
        </div>
      </div>
      {b.notes && <div className="td-booking-notes"><i className="fas fa-comment-alt" /> {b.notes}</div>}
      {type === "request" && (
        <div className="td-booking-actions">
          <button className="btn btn-primary btn-sm" onClick={onAccept}><i className="fas fa-check" /> Accept</button>
          <button className="btn btn-secondary btn-sm" onClick={onDecline}><i className="fas fa-times" /> Decline</button>
        </div>
      )}
      {type === "upcoming" && (
        <div className="td-booking-actions">
          <button className="btn btn-success btn-sm" onClick={onComplete}><i className="fas fa-flag-checkered" /> Mark Complete</button>
        </div>
      )}
    </div>
  );
}