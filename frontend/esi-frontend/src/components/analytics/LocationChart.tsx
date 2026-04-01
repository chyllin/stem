import { useState } from "react";
import type { Tutor } from "../../types";
import "./Analytics.css";

const COLORS = ["#4338CA","#764ba2","#EC4899","#f5576c","#06B6D4","#00f2fe","#10B981","#38f9d7"];

export default function LocationChart({ tutors }: { tutors: Tutor[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const locationMap: Record<string, number> = {};
  tutors.forEach((t) => { locationMap[t.location] = (locationMap[t.location] || 0) + 1; });
  const data = Object.entries(locationMap).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([label, value], i) => ({ label, value, color: COLORS[i % COLORS.length], i }));

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 70, cy = 70, r = 54;
  let cum = -Math.PI / 2;

  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cum), y1 = cy + r * Math.sin(cum);
    cum += angle;
    const x2 = cx + r * Math.cos(cum), y2 = cy + r * Math.sin(cum);
    return { ...d, path: `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z` };
  });

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>Location Distribution</h3>
        <p className="chart-sub">Tutors by area in Accra</p>
      </div>
      <div className="donut-wrap">
        <svg viewBox="0 0 140 140" className="donut-svg">
          {slices.map((s) => (
            <path key={s.label} d={s.path} fill={s.color}
              opacity={hovered === null || hovered === s.i ? 0.9 : 0.25}
              style={{ cursor: "pointer", transition: "opacity 200ms, transform 200ms", transformOrigin: `${cx}px ${cy}px`, transform: hovered === s.i ? "scale(1.05)" : "scale(1)" }}
              onMouseEnter={() => setHovered(s.i)} onMouseLeave={() => setHovered(null)}
            />
          ))}
          <circle cx={cx} cy={cy} r={30} fill="white" />
          <text x={cx} y={cy - 3} textAnchor="middle" fontSize="7" fontWeight="700" fill="#111827">
            {hovered !== null ? data[hovered].label.split(" ")[0] : "Accra"}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="6" fill="#6B7280">
            {hovered !== null ? `${data[hovered].value} tutor${data[hovered].value !== 1 ? "s" : ""}` : "Ghana"}
          </text>
        </svg>
        <div className="donut-legend">
          {data.map((d) => (
            <div key={d.label} className={`donut-leg-item${hovered === d.i ? " active" : ""}`}
              onMouseEnter={() => setHovered(d.i)} onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <span className="donut-dot" style={{ background: d.color }} />
              <span>{d.label} ({d.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}