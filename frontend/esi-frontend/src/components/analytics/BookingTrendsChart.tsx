import { useState } from "react";
import "./Analytics.css";

const generateTrendData = (): number[] =>
  Array.from({ length: 30 }, (_, i) =>
    Math.round(5 + Math.sin(i * 0.4) * 4 + i * 0.6 + Math.random() * 3)
  );

const DATA = generateTrendData();

export default function BookingTrendsChart() {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; val: number; day: number } | null>(null);
  const max = Math.max(...DATA, 1);
  const w = 100; const h = 60;

  const pts = DATA.map((v, i) => ({
    x: (i / (DATA.length - 1)) * w,
    y: h - (v / max) * (h - 4) - 2,
    v,
  }));

  const points    = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>Booking Trends</h3>
        <p className="chart-sub">Daily bookings over the last 30 days</p>
        <div className="chart-legend">
          <span className="leg-item"><span className="leg-dot" style={{ background: "#4338CA" }} /> Bookings</span>
        </div>
      </div>

      <div className="line-chart-wrap" style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="line-chart-svg"
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="bookingFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#4338CA" stopOpacity=".35" />
              <stop offset="100%" stopColor="#4338CA" stopOpacity="0"   />
            </linearGradient>
          </defs>
          <polyline points={areaPoints} fill="url(#bookingFill)" />
          <polyline points={points} fill="none" stroke="#4338CA" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
          {/* Invisible hover targets */}
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p.x} cy={p.y} r="3"
              fill="transparent"
              stroke="transparent"
              strokeWidth="4"
              onMouseEnter={(e) => {
                const rect = (e.target as SVGCircleElement).closest("svg")!.getBoundingClientRect();
                setTooltip({ x: (p.x / w) * rect.width, y: (p.y / h) * rect.height, val: p.v, day: i + 1 });
              }}
            />
          ))}
          {/* Active dot */}
          {tooltip && (
            <circle
              cx={pts[tooltip.day - 1].x}
              cy={pts[tooltip.day - 1].y}
              r="2.5" fill="#4338CA" stroke="#fff" strokeWidth="1"
            />
          )}
        </svg>
        {tooltip && (
          <div className="chart-tooltip" style={{ left: tooltip.x, top: Math.max(tooltip.y - 36, 0) }}>
            <strong>Day {tooltip.day}</strong><br />{tooltip.val} bookings
          </div>
        )}
      </div>
    </div>
  );
}