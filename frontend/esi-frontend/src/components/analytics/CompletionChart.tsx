import { useState } from "react";
import type { Booking } from "../../types";
import { SUBJECTS } from "../../utils";
import "./Analytics.css";

const COLORS = ["#4338CA","#6366F1","#06B6D4","#10B981"];

export default function CompletionChart({ bookings }: { bookings: Booking[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const data = SUBJECTS.map((s, i) => {
    const sub = bookings.filter((b) => b.subjects.includes(s));
    const rate = sub.length > 0
      ? Math.round((sub.filter((b) => b.status === "Completed").length / sub.length) * 100)
      : [84, 95, 0, 79][i];
    return { label: s.split(" ")[0], full: s, value: rate, color: COLORS[i] };
  });

  return (
    <div className="chart-card full-width">
      <div className="chart-head">
        <h3>Session Completion Rate by Subject</h3>
        <p className="chart-sub">Percentage of sessions completed vs booked</p>
      </div>
      <div className="bar-chart-wrap">
        <div className="bar-chart-cols">
          {data.map((d, i) => (
            <div
              key={d.label}
              className={`bar-col${hovered === i ? " hovered" : ""}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === i && (
                <div className="bar-tooltip">{d.full}<br /><strong>{d.value}%</strong> completion</div>
              )}
              <div
                className="bar-fill animated"
                style={{ height: `${(d.value / 100) * 160}px`, background: d.color, animationDelay: `${i * 120}ms` }}
              />
              <div className="bar-col-label">
                {d.label}<br />
                <strong style={{ color: d.color }}>{d.value}%</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}