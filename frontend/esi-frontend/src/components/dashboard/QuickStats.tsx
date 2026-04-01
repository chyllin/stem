import type { Booking, Like } from "../../types";
import "./Dashboard.css";

interface QuickStatsProps {
  bookings: Booking[];
  likes: Like[];
  parentId: string;
}

export default function QuickStats({ bookings, likes, parentId }: QuickStatsProps) {
  const myBookings  = bookings.filter((b) => b.parent_id === parentId);
  const upcoming    = myBookings.filter(
    (b) => b.status !== "Cancelled" && b.session_date > Date.now()
  ).length;
  const completed   = myBookings.filter((b) => b.status === "Completed").length;
  const favCount    = likes.filter((l) => l.parent_id === parentId && l.liked).length;
  const totalSpent  = myBookings
    .filter((b) => b.status === "Completed")
    .reduce((s, b) => s + b.total_cost, 0);

  const stats = [
    { label: "Active Bookings",    value: upcoming },
    { label: "Completed Sessions", value: completed },
    { label: "Favourite Tutors",   value: favCount },
    { label: "Total Spent",        value: `GHS ${totalSpent}` },
  ];

  return (
    <div className="dash-card">
      <div className="dash-card-title">
        <i className="fas fa-chart-bar" /> Quick Stats
      </div>
      {stats.map(({ label, value }) => (
        <div key={label} className="stat-row">
          <span className="stat-row-label">{label}</span>
          <span className="stat-row-val">{value}</span>
        </div>
      ))}
    </div>
  );
}
