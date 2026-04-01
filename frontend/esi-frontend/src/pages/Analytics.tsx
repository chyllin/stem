import type { Tutor, Booking, Rating, Parent, ProgressEntry } from "../types";
import MetricsCards from "../components/analytics/MetricsCards";
import BookingTrendsChart from "../components/analytics/BookingTrendsChart";
import SubjectDistributionChart from "../components/analytics/SubjectDistributionChart";
import TopTutorsChart from "../components/analytics/TopTutorsChart";
import LocationChart from "../components/analytics/LocationChart";
import CompletionChart from "../components/analytics/CompletionChart";
import PerformanceScatter from "../components/analytics/PerformanceScatter";
import "../components/analytics/Analytics.css";

interface Props {
  tutors: Tutor[];
  bookings: Booking[];
  ratings: Rating[];
  parents: Parent[];
  progress: ProgressEntry[];
}

export default function AnalyticsPage({ tutors, bookings, ratings, parents, progress }: Props) {
  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Platform Analytics</h1>
        <p>Comprehensive insights into tutor performance and platform metrics</p>
      </div>

      {/* Controls */}
      <div className="analytics-controls">
        <div className="date-picker-row">
          <i className="fas fa-calendar" />
          <select defaultValue="30">
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>
        <div className="ana-quick-stats">
          <span className="ana-qs-item"><i className="fas fa-users" /> {parents.length} Parents</span>
          <span className="ana-qs-item"><i className="fas fa-chart-line" /> {progress.length} Progress Logs</span>
          <span className="ana-qs-item"><i className="fas fa-star" /> {ratings.length ? (ratings.reduce((s, r) => s + r.rating_score, 0) / ratings.length).toFixed(1) : "—"} Avg Rating</span>
          <span className="ana-qs-item ana-qs-green"><i className="fas fa-money-bill-wave" /> GHS {bookings.filter(b => b.status === "Completed").reduce((s, b) => s + b.total_cost, 0)} Revenue</span>
        </div>
        <button className="btn btn-secondary">
          <i className="fas fa-download" /> Export Report
        </button>
      </div>

      {/* Metric cards */}
      <MetricsCards tutors={tutors} bookings={bookings} />

      {/* Charts */}
      <div className="charts-grid">
        <BookingTrendsChart />
        <SubjectDistributionChart tutors={tutors} />
        <TopTutorsChart tutors={tutors} />
        <LocationChart tutors={tutors} />
        <CompletionChart bookings={bookings} />
        <PerformanceScatter tutors={tutors} />
      </div>
    </div>
  );
}