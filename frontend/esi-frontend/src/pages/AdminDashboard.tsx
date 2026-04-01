import type { Tutor, Parent, Booking, Rating, ProgressEntry } from "../types";
import { avatarUrl, formatDate } from "../utils";
import "../components/dashboard/Dashboard.css";

interface Props {
  tutors: Tutor[];
  parents: Parent[];
  bookings: Booking[];
  ratings: Rating[];
  progress: ProgressEntry[];
}

const STATUS_COLOR: Record<string, string> = {
  Pending:   "#f59e0b",
  Confirmed: "#6366f1",
  Completed: "#10b981",
  Cancelled: "#ef4444",
};

export default function AdminDashboard({ tutors, parents, bookings, ratings, progress }: Props) {

  const totalRevenue    = bookings.filter((b) => b.status === "Completed").reduce((s, b) => s + b.total_cost, 0);
  const completedCount  = bookings.filter((b) => b.status === "Completed").length;
  const pendingCount    = bookings.filter((b) => b.status === "Pending").length;
  const avgRating       = ratings.length
    ? (ratings.reduce((s, r) => s + r.rating_score, 0) / ratings.length).toFixed(1)
    : "—";
  const verifiedTutors  = tutors.filter((t) => t.verified).length;
  const activeStudents  = [...new Set(bookings.filter((b) => b.status !== "Cancelled").map((b) => b.parent_id))].length;

  const statCards = [
    { icon: "fa-chalkboard-teacher", label: "Total Tutors",  val: tutors.length,        sub: `${verifiedTutors} verified`,       color: "#6366f1" },
    { icon: "fa-users",              label: "Total Parents", val: parents.length,        sub: `${activeStudents} active`,          color: "#8b5cf6" },
    { icon: "fa-calendar-check",     label: "Bookings",      val: bookings.length,       sub: `${completedCount} completed`,       color: "#10b981" },
    { icon: "fa-clock",              label: "Pending",       val: pendingCount,          sub: "awaiting response",                 color: "#f59e0b" },
    { icon: "fa-star",               label: "Avg Rating",    val: avgRating,             sub: `${ratings.length} reviews`,         color: "#ec4899" },
    { icon: "fa-money-bill-wave",    label: "Total Revenue", val: `GHS ${totalRevenue}`, sub: "from completed sessions",           color: "#14b8a6" },
  ];

  const recentBookings = [...bookings].sort((a, b) => b.session_date - a.session_date).slice(0, 8);
  const topTutors = [...tutors].sort((a, b) => b.total_sessions - a.total_sessions).slice(0, 5);

  const subjectMap: Record<string, number> = {};
  bookings.forEach((b) => b.subjects.forEach((s) => { subjectMap[s] = (subjectMap[s] ?? 0) + 1; }));
  const subjectData = Object.entries(subjectMap).sort((a, b) => b[1] - a[1]);
  const maxSubj = Math.max(...subjectData.map((s) => s[1]), 1);

  const recentProgress = [...progress].sort((a, b) => b.date - a.date).slice(0, 5);

  const PERF_COLORS: Record<string, string> = {
    "Excellent":  "#10b981",
    "Good":       "#6366f1",
    "Needs Work": "#f59e0b",
    "Struggling": "#ef4444",
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview — manage tutors, parents, bookings and performance.</p>
      </div>

      <div className="adm-wrap">

        <div className="adm-stats-grid">
          {statCards.map((s) => (
            <div key={s.label} className="adm-stat-card">
              <div className="adm-stat-icon" style={{ background: s.color + "18", color: s.color }}>
                <i className={`fas ${s.icon}`} />
              </div>
              <div className="adm-stat-body">
                <div className="adm-stat-val">{s.val}</div>
                <div className="adm-stat-label">{s.label}</div>
                <div className="adm-stat-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="adm-main-grid">

          <div className="dash-card adm-span-2">
            <div className="dash-card-title">
              <i className="fas fa-calendar-alt" /> Recent Bookings
              <span className="dash-card-count">{bookings.length}</span>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Tutor</th><th>Parent</th><th>Subject(s)</th><th>Date</th><th>Amount</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => {
                    const tutor  = tutors.find((t) => t.id === b.tutor_id);
                    const parent = parents.find((p) => p.id === b.parent_id);
                    return (
                      <tr key={b.id}>
                        <td>
                          <div className="adm-table-person">
                            <img src={avatarUrl(tutor?.full_name ?? "T", 60)} alt="" className="adm-table-avatar" />
                            <span>{tutor?.full_name ?? b.tutor_id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="adm-table-person">
                            <img src={avatarUrl(parent?.full_name ?? "P", 60)} alt="" className="adm-table-avatar" />
                            <span>{parent?.full_name ?? b.parent_id}</span>
                          </div>
                        </td>
                        <td><span className="adm-subj-tags">{b.subjects.join(", ")}</span></td>
                        {/* Fix: wrap number timestamp with String() */}
                        <td className="adm-muted">{formatDate(String(b.session_date))}</td>
                        <td className="adm-amount">GHS {b.total_cost}</td>
                        <td>
                          <span className="adm-status-pill" style={{
                            background: STATUS_COLOR[b.status] + "18",
                            color: STATUS_COLOR[b.status],
                            border: `1px solid ${STATUS_COLOR[b.status]}44`,
                          }}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-title"><i className="fas fa-trophy" /> Top Tutors</div>
            {topTutors.map((t, i) => (
              <div key={t.id} className="adm-tutor-row">
                <div className="adm-rank" style={{ background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c2f" : "var(--p-soft)", color: i < 3 ? "#fff" : "var(--p)" }}>
                  {i + 1}
                </div>
                <img src={avatarUrl(t.full_name, 80)} alt={t.full_name} className="adm-tutor-avatar" />
                <div className="adm-tutor-info">
                  <div className="adm-tutor-name">{t.full_name}</div>
                  <div className="adm-tutor-meta">
                    {t.subjects.slice(0,2).map((s) => <span key={s} className="adm-mini-tag">{s}</span>)}
                  </div>
                </div>
                <div className="adm-tutor-stats">
                  <div className="adm-tutor-stat"><span>{t.total_sessions}</span><small>sessions</small></div>
                  <div className="adm-tutor-stat"><span>⭐{t.average_rating}</span><small>rating</small></div>
                </div>
              </div>
            ))}
          </div>

          <div className="dash-card">
            <div className="dash-card-title"><i className="fas fa-book" /> Subject Demand</div>
            <div className="adm-subj-bars">
              {subjectData.map(([subj, count]) => (
                <div key={subj} className="adm-subj-bar-row">
                  <div className="adm-subj-name">{subj}</div>
                  <div className="adm-bar-track">
                    <div className="adm-bar-fill" style={{ width: `${(count / maxSubj) * 100}%` }} />
                  </div>
                  <div className="adm-subj-count">{count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-title">
              <i className="fas fa-chalkboard-teacher" /> All Tutors
              <span className="dash-card-count">{tutors.length}</span>
            </div>
            <div className="adm-person-list">
              {tutors.map((t) => {
                const tutorBookings = bookings.filter((b) => b.tutor_id === t.id);
                const earned = tutorBookings.filter((b) => b.status === "Completed").reduce((s, b) => s + b.total_cost, 0);
                return (
                  <div key={t.id} className="adm-person-row">
                    <img src={avatarUrl(t.full_name, 80)} alt={t.full_name} className="adm-person-avatar" />
                    <div className="adm-person-info">
                      <div className="adm-person-name">
                        {t.full_name}
                        {t.verified && <i className="fas fa-check-circle adm-verified-icon" />}
                      </div>
                      <div className="adm-person-meta">{t.location} · GHS {t.hourly_rate}/hr</div>
                    </div>
                    <div className="adm-person-right">
                      <div className="adm-person-stat">GHS {earned}</div>
                      <div className="adm-person-sub">earned</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-title">
              <i className="fas fa-users" /> All Parents
              <span className="dash-card-count">{parents.length}</span>
            </div>
            <div className="adm-person-list">
              {parents.map((p) => {
                const pBookings = bookings.filter((b) => b.parent_id === p.id);
                return (
                  <div key={p.id} className="adm-person-row">
                    <img src={avatarUrl(p.full_name, 80)} alt={p.full_name} className="adm-person-avatar" />
                    <div className="adm-person-info">
                      <div className="adm-person-name">{p.full_name}</div>
                      <div className="adm-person-meta">{p.child_grade} · {p.location}</div>
                    </div>
                    <div className="adm-person-right">
                      <div className="adm-person-stat">{pBookings.length}</div>
                      <div className="adm-person-sub">bookings</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dash-card adm-span-2">
            <div className="dash-card-title">
              <i className="fas fa-chart-line" /> Recent Student Progress Activity
              <span className="dash-card-count">{progress.length} entries</span>
            </div>
            {recentProgress.length === 0 ? (
              <p style={{ color: "var(--text3)", fontSize: ".88rem" }}>No progress entries yet.</p>
            ) : (
              <div className="adm-progress-list">
                {recentProgress.map((entry) => {
                  const tutor  = tutors.find((t) => t.id === entry.tutor_id);
                  const parent = parents.find((p) => p.id === entry.parent_id);
                  const color  = PERF_COLORS[entry.performance];
                  return (
                    <div key={entry.id} className="adm-progress-row">
                      <div className="adm-prog-dot" style={{ background: color }} />
                      <div className="adm-prog-body">
                        <div className="adm-prog-head">
                          <span className="adm-prog-topic">{entry.topic}</span>
                          <span className="adm-prog-perf" style={{ color, background: color + "18", border: `1px solid ${color}33` }}>
                            {entry.performance}
                          </span>
                        </div>
                        <div className="adm-prog-meta">
                          <span><i className="fas fa-chalkboard-teacher" /> {tutor?.full_name ?? "Tutor"}</span>
                          <span><i className="fas fa-user" /> {parent?.full_name ?? "Parent"}</span>
                          <span><i className="fas fa-book" /> {entry.subject}</span>
                          {/* Fix: wrap number timestamp with String() */}
                          <span><i className="fas fa-calendar" /> {formatDate(String(entry.date))}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}