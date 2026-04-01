import { useState } from "react";
import type { Tutor } from "../../types";
import { SUBJECTS } from "../../utils";
import "./Analytics.css";

const COLORS = ["#4338CA","#EC4899","#06B6D4","#10B981"];

export default function SubjectDistributionChart({ tutors }: { tutors: Tutor[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const data = SUBJECTS.map((s, i) => ({
    label: s, short: s.split(" ")[0],
    value: tutors.filter((t) => t.subjects.includes(s)).length,
    color: COLORS[i],
  }));

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 70, cy = 70, r = 54, hole = 32;
  let cumAngle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    return { ...d, i,
      path: `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
    };
  });

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>Subject Distribution</h3>
        <p className="chart-sub">Tutors available per STEM subject</p>
      </div>
      <div className="donut-wrap">
        <svg viewBox="0 0 140 140" className="donut-svg">
          {slices.map((s) => (
            <path
              key={s.label} d={s.path}
              fill={s.color}
              opacity={hovered === null || hovered === s.i ? 0.9 : 0.3}
              style={{ cursor: "pointer", transition: "opacity 200ms" }}
              onMouseEnter={() => setHovered(s.i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          <circle cx={cx} cy={cy} r={hole} fill="white" />
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9" fontWeight="800" fill="#111827">
            {hovered !== null ? data[hovered].value : total}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="6" fill="#6B7280">
            {hovered !== null ? data[hovered].short : "tutors"}
          </text>
        </svg>
        <div className="donut-legend">
          {data.map((d, i) => (
            <div key={d.label} className={`donut-leg-item${hovered === i ? " active" : ""}`}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <span className="donut-dot" style={{ background: d.color }} />
              <span>{d.short} ({d.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}