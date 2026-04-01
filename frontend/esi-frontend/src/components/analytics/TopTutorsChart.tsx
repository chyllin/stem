import { useState } from "react";
import type { Tutor } from "../../types";
import "./Analytics.css";

const COLORS = ["#4338CA","#6366F1","#EC4899","#06B6D4","#10B981"];

export default function TopTutorsChart({ tutors }: { tutors: Tutor[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const top5 = [...tutors].sort((a, b) => b.average_rating - a.average_rating).slice(0, 5);

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>Top Performing Tutors</h3>
        <p className="chart-sub">Ranked by average rating</p>
      </div>
      <div className="h-bar-wrap">
        {top5.map((t, i) => (
          <div
            key={t.id}
            className={`h-bar-row${hovered === i ? " hovered" : ""}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="h-bar-rank" style={{ background: COLORS[i] }}>{i + 1}</div>
            <div className="h-bar-label" title={t.full_name}>{t.full_name.split(" ")[0]}</div>
            <div className="h-bar-track">
              <div
                className="h-bar-fill animated"
                style={{ width: `${(t.average_rating / 5) * 100}%`, background: COLORS[i], animationDelay: `${i * 100}ms` }}
              />
            </div>
            <div className="h-bar-value" style={{ color: COLORS[i] }}>{t.average_rating.toFixed(1)}★</div>
          </div>
        ))}
      </div>
    </div>
  );
}