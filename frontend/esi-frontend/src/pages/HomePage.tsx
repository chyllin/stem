import type { Page } from "../types";
import "./Home.css";

interface Props {
  onNavigate: (page: Page) => void;
}

export default function HomePage({ onNavigate }: Props) {
  return (
    <div className="fade-up">
      {/* Hero */}
      <div className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-badge">
            <i className="fas fa-bolt" /> Uber-like Intelligent Matching
          </div>
          <h1 className="home-hero-title">
            The Smartest Way to Find<br />a STEM Tutor in Accra
          </h1>
          <p className="home-hero-sub">
            Don't browse. Don't guess. Tell us your child's needs and our AI
            automatically assigns the best verified in-person STEM tutor —
            just like Uber assigns a driver.
          </p>
          <div className="home-hero-cta">
            <button className="btn btn-lg btn-primary" onClick={() => onNavigate("register")}>
              <i className="fas fa-user-plus" /> Get Started — It's Free
            </button>
            <button
              className="btn btn-lg"
              style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,.35)" }}
              onClick={() => onNavigate("login")}
            >
              <i className="fas fa-sign-in-alt" /> Sign In
            </button>
          </div>
          <div className="home-hero-note">
            <i className="fas fa-info-circle" />
            <span>Like Uber — you don't pick a tutor. Our algorithm assigns the best match automatically.</span>
          </div>
          <div className="home-hero-stats">
            {[
              { num: "50+",   label: "Verified Tutors",    icon: "fa-users" },
              { num: "4.8",   label: "Average Rating",     icon: "fa-star" },
              { num: "98%",   label: "Parent Satisfaction", icon: "fa-heart" },
              { num: "25km",  label: "Max Distance",       icon: "fa-map-marker-alt" },
            ].map(({ num, label, icon }) => (
              <div key={label} className="home-stat">
                <div className="home-stat-icon"><i className={`fas ${icon}`} /></div>
                <div className="home-stat-num">{num}</div>
                <div className="home-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="section">
        <h2 className="section-title">STEM Subjects We Cover</h2>
        <div className="home-subjects">
          {[
            { icon: "fa-calculator",       name: "Mathematics",         desc: "Algebra, Geometry, BECE Prep" },
            { icon: "fa-flask",            name: "Integrated Science",   desc: "Physics, Chemistry, Biology" },
            { icon: "fa-laptop-code",      name: "ICT / Computing",      desc: "Coding, Python, Digital Literacy" },
            { icon: "fa-drafting-compass", name: "Design & Technology",  desc: "Technical Drawing, Circuits" },
          ].map(({ icon, name, desc }) => (
            <div key={name} className="home-subj-card" onClick={() => onNavigate("register")}>
              <i className={`fas ${icon}`} />
              <h3>{name}</h3>
              <p>{desc}</p>
              <span>Get Matched →</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}