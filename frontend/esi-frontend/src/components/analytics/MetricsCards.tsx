import { useEffect, useState } from "react";
import type { Tutor, Booking } from "../../types";
import "./Analytics.css";

interface Props { tutors: Tutor[]; bookings: Booking[]; }

function useCountUp(target: number, duration = 1400, active: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return val;
}

function MetricCard({ gradient, icon, label, value, numericValue, change, pos, delay }: {
  gradient: string; icon: string; label: string; value: string;
  numericValue: number; change: string; pos: boolean; delay: number;
}) {
  const [active, setActive] = useState(false);
  useEffect(() => { const t = setTimeout(() => setActive(true), delay); return () => clearTimeout(t); }, [delay]);
  const counted = useCountUp(numericValue, 1400, active);
  const displayVal = value.includes("%") ? `${counted}%` : value.includes(".") ? value : String(counted);

  return (
    <div className="metric-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="metric-ico" style={{ background: gradient }}>
        <i className={`fas ${icon}`} />
      </div>
      <div className="metric-info">
        <div className="metric-label">{label}</div>
        <div className="metric-val">{displayVal}</div>
        <div className={`metric-change ${pos ? "pos" : "neg"}`}>
          <i className={`fas fa-arrow-${pos ? "up" : "down"}`} /> {change}
        </div>
      </div>
      <div className="metric-glow" style={{ background: gradient }} />
    </div>
  );
}

export default function MetricsCards({ tutors, bookings }: Props) {
  const completed = bookings.filter((b) => b.status === "Completed").length;
  return (
    <div className="metrics-grid">
      {[
        { gradient: "linear-gradient(135deg,#667eea,#764ba2)", icon: "fa-users",        label: "Total Tutors",    value: String(tutors.length),  numericValue: tutors.length,     change: "+12% from last month", pos: true  },
        { gradient: "linear-gradient(135deg,#f093fb,#f5576c)", icon: "fa-book-open",    label: "Total Sessions",  value: String(completed + 47), numericValue: completed + 47,    change: "+25% from last month", pos: true  },
        { gradient: "linear-gradient(135deg,#4facfe,#00f2fe)", icon: "fa-star",         label: "Avg Rating",      value: "4.8",                  numericValue: 5,                 change: "+0.3 from last month", pos: true  },
        { gradient: "linear-gradient(135deg,#43e97b,#38f9d7)", icon: "fa-check-circle", label: "Completion Rate", value: "96%",                  numericValue: 96,                change: "+3% from last month",  pos: true  },
      ].map((m, i) => <MetricCard key={m.label} {...m} delay={i * 120} />)}
    </div>
  );
}