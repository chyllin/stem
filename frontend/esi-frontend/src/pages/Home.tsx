import type { Page } from "../types";
import { SUBJECTS, LOCATIONS } from "../utils";
import "./Pages.css";

interface HomePageProps {
  totalTutors: number;
  completedSessions: number;
  onNavigate: (page: Page) => void;
  onSubjectFilter: (subject: string) => void;
}

const FEATURES = [
  { icon: "fa-check-circle",   title: "Verified Tutors",        desc: "All tutors are verified with proper qualifications and background checks." },
  { icon: "fa-brain",          title: "AI-Powered Matching",     desc: "Smart algorithm matches your needs with the best-fit tutors." },
  { icon: "fa-star",           title: "Parent Reviews",          desc: "Transparent rating system helps you make informed decisions." },
  { icon: "fa-map-marker-alt", title: "Local Tutors",            desc: "Find tutors in your neighbourhood across Accra." },
  { icon: "fa-calendar-check", title: "Flexible Scheduling",     desc: "Book sessions that fit your family's schedule." },
  { icon: "fa-chart-line",     title: "Performance Analytics",   desc: "Track tutor performance and student progress." },
];

const HOW_IT_WORKS = [
  { icon: "fa-user-plus",    title: "Create Account", desc: "Sign up as a parent and tell us about your child's needs." },
  { icon: "fa-search",       title: "Find Tutors",    desc: "Browse profiles and filter by subject, location, and ratings." },
  { icon: "fa-calendar-alt", title: "Book Session",   desc: "Request a tutoring session at your preferred time." },
  { icon: "fa-star",         title: "Rate & Review",  desc: "Share your experience and help other parents." },
];

const SUBJECT_CARDS = [
  { icon: "fa-calculator",        name: "Mathematics",            key: "Mathematics",                  desc: "Algebra, Geometry, Problem Solving" },
  { icon: "fa-flask",             name: "Integrated Science",     key: "Integrated Science",            desc: "Physics, Chemistry, Biology" },
  { icon: "fa-laptop-code",       name: "ICT / Computing",        key: "ICT/Computing",                 desc: "Coding, Robotics, Digital Literacy" },
  { icon: "fa-drafting-compass",  name: "Design & Technology",    key: "Basic Design & Technology",    desc: "Technical Drawing, Design Thinking" },
];

export default function HomePage({
  totalTutors,
  completedSessions,
  onNavigate,
  onSubjectFilter,
}: HomePageProps) {
  const handleSubject = (key: string) => {
    onSubjectFilter(key);
    onNavigate("tutors");
  };

  return (
    <div className="fade-up">
      {/* ── Hero ── */}
      <div className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">
            Find the Perfect STEM Tutor<br />for Your Child
          </h1>
          <p className="hero-sub">
            Connect with qualified, verified STEM tutors in Accra. AI-powered
            matching ensures the best fit for your child's learning needs.
          </p>

          <div className="hero-search">
            <div className="search-input-row">
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Search by subject (Math, Science, ICT…)"
                onKeyDown={(e) => e.key === "Enter" && onNavigate("tutors")}
              />
            </div>
            <div className="hero-search-filters">
              <select className="filter-select">
                <option value="">All Subjects</option>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select className="filter-select">
                <option disabled>Location in Accra</option>
                {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
              </select>
              <button
                className="btn btn-primary"
                onClick={() => onNavigate("tutors")}
              >
                <i className="fas fa-search" /> Find Tutors
              </button>
            </div>
          </div>

          <div className="hero-stats">
            {[
              { num: totalTutors,                    label: "Verified Tutors",   suf: ""   },
              { num: completedSessions + 47,         label: "Sessions Completed",suf: ""   },
              { num: null, str: "4.8", suf: "/5",   label: "Average Rating"               },
              { num: null, str: "98",  suf: "%",     label: "Parent Satisfaction"          },
            ].map(({ num, str, suf, label }) => (
              <div key={label} className="hero-stat-card">
                <div className="hero-stat-num">
                  {num ?? str}
                  <span className="hero-stat-suf">{suf}</span>
                </div>
                <div className="hero-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div className="section">
        <h2 className="section-title">Why Choose Our Platform?</h2>
        <div className="features-grid">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="feature-card fade-up">
              <div className="feat-icon"><i className={`fas ${icon}`} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="hiw-section">
        <div className="section">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-row">
            {HOW_IT_WORKS.map(({ icon, title, desc }, i, arr) => (
              <div key={title} className="steps-row-inner">
                <div className="step">
                  <div className="step-num">{i + 1}</div>
                  <div className="step-ico"><i className={`fas ${icon}`} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="step-arrow">
                    <i className="fas fa-arrow-right" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Subjects ── */}
      <div className="section">
        <h2 className="section-title">Popular STEM Subjects</h2>
        <div className="subjects-grid">
          {SUBJECT_CARDS.map(({ icon, name, key, desc }) => (
            <div
              key={key}
              className="subj-card"
              onClick={() => handleSubject(key)}
            >
              <i className={`fas ${icon}`} />
              <h3>{name}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
