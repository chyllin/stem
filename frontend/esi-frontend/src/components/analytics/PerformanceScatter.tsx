import { useState } from "react";
import type { Tutor } from "../../types";
import "./Analytics.css";

const COLORS = ["#4338CA","#6366F1","#EC4899","#06B6D4","#10B981","#F59E0B","#EF4444","#8B5CF6"];

export default function PerformanceScatter({ tutors }: { tutors: Tutor[] }) {
  const [tooltip, setTooltip] = useState<{ tutor: Tutor; x: number; y: number } | null>(null);
  const maxX = Math.max(...tutors.map((t) => t.response_time_hours), 8);
  const maxY = Math.max(...tutors.map((t) => t.total_sessions), 10);

  return (
    <div className="chart-card full-width">
      <div className="chart-head">
        <h3>Tutor Performance Overview</h3>
        <p className="chart-sub">Response time (hrs) vs total sessions completed</p>
        <div className="chart-legend">
          {tutors.slice(0, 4).map((t, i) => (
            <span key={t.id} className="leg-item">
              <span className="leg-dot" style={{ background: COLORS[i] }} />
              {t.full_name.split(" ")[0]}
            </span>
          ))}
        </div>
      </div>

      <div className="scatter-outer">
        <div className="scatter-y-label">Total Sessions</div>
        <div className="scatter-field" onMouseLeave={() => setTooltip(null)}>
          {/* Grid lines */}
          {[25, 50, 75].map((p) => (
            <div key={p} className="scatter-gridline" style={{ bottom: `${p}%` }} />
          ))}
          {tutors.map((t, i) => {
            const left = (t.response_time_hours / maxX) * 88 + 4;
            const bottom = (t.total_sessions / maxY) * 88 + 4;
            return (
              <div
                key={t.id}
                className="scatter-dot"
                style={{ left: `${left}%`, bottom: `${bottom}%`, background: COLORS[i % COLORS.length] }}
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                  const el = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setTooltip({ tutor: t, x: el.left - rect.left + 8, y: el.top - rect.top - 70 });
                }}
              >
                <span className="scatter-dot-ring" style={{ borderColor: COLORS[i % COLORS.length] }} />
              </div>
            );
          })}
          {tooltip && (
            <div className="scatter-tooltip" style={{ left: tooltip.x, top: Math.max(tooltip.y, 4) }}>
              <strong>{tooltip.tutor.full_name}</strong><br />
              <span>⏱ {tooltip.tutor.response_time_hours}h response</span><br />
              <span>📚 {tooltip.tutor.total_sessions} sessions</span><br />
              <span>⭐ {tooltip.tutor.average_rating} rating</span>
            </div>
          )}
        </div>
        <div className="scatter-x-label">Response Time (hours)</div>
      </div>
    </div>
  );
}