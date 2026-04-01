import { useState, useEffect, useRef } from "react";
import type { Tutor, Parent, Like, Rating } from "../types";
import { avatarUrl, generateStars, SUBJECTS, LOCATIONS } from "../utils";
import Modal from "../components/layout/Modal";
import { formatDate } from "../utils";
import "./Tutors.css";

interface TutorsPageProps {
  tutors: Tutor[];
  currentUser: Parent | null;
  likes: Like[];
  ratings: Rating[];
  initialSubjectFilter?: string;
  onToggleLike: (tutorId: string) => void;
  onOpenBooking: (tutor: Tutor) => void;
  onLoginRequired: () => void;
}

type SortKey = "rating" | "sessions" | "experience" | "price-low" | "price-high";

const PRICE_RANGES = [
  { label: "Any Price", value: "" },
  { label: "Under GHS 50", value: "0-50" },
  { label: "GHS 50–100", value: "50-100" },
  { label: "GHS 100–200", value: "100-200" },
  { label: "GHS 200+", value: "200-9999" },
];

const RATING_OPTIONS = [
  { label: "Any Rating", value: "" },
  { label: "4★ & above", value: "4" },
  { label: "4.5★ & above", value: "4.5" },
];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Top Rated", value: "rating" },
  { label: "Most Sessions", value: "sessions" },
  { label: "Most Experienced", value: "experience" },
  { label: "Price: Low → High", value: "price-low" },
  { label: "Price: High → Low", value: "price-high" },
];

export default function TutorsPage({
  tutors,
  currentUser,
  likes,
  ratings,
  initialSubjectFilter = "",
  onToggleLike,
  onOpenBooking,
  onLoginRequired,
}: TutorsPageProps) {
  const [query,      setQuery]      = useState("");
  const [subject,    setSubject]    = useState(initialSubjectFilter);
  const [location,   setLocation]   = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [minRating,  setMinRating]  = useState("");
  const [sort,       setSort]       = useState<SortKey>("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [profileTutor, setProfileTutor] = useState<Tutor | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSubject(initialSubjectFilter);
  }, [initialSubjectFilter]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const isLiked = (tutorId: string) =>
    likes.some((l) => l.tutor_id === tutorId && l.parent_id === currentUser?.id && l.liked);

  const handleLike = (e: React.MouseEvent, tutorId: string) => {
    e.stopPropagation();
    if (!currentUser) { onLoginRequired(); return; }
    onToggleLike(tutorId);
  };

  const handleBook = (e: React.MouseEvent, tutor: Tutor) => {
    e.stopPropagation();
    if (!currentUser) { onLoginRequired(); return; }
    onOpenBooking(tutor);
  };

  const activeFilterCount = [subject, location, priceRange, minRating].filter(Boolean).length;

  const clearAll = () => {
    setQuery(""); setSubject(""); setLocation("");
    setPriceRange(""); setMinRating(""); setSort("rating");
  };

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = tutors
    .filter((t) => {
      // Free text search
      if (query) {
        const q = query.toLowerCase();
        const match =
          t.full_name.toLowerCase().includes(q) ||
          t.subjects.some((s) => s.toLowerCase().includes(q)) ||
          t.location.toLowerCase().includes(q) ||
          t.bio?.toLowerCase().includes(q) ||
          t.qualifications?.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Subject filter
      if (subject && !t.subjects.some((s) => s.toLowerCase().includes(subject.toLowerCase()))) return false;
      // Location filter
      if (location && t.location !== location) return false;
      // Price range filter
      if (priceRange) {
        const [min, max] = priceRange.split("-").map(Number);
        if (t.hourly_rate < min || t.hourly_rate > max) return false;
      }
      // Rating filter
      if (minRating && t.average_rating < parseFloat(minRating)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case "sessions":   return b.total_sessions - a.total_sessions;
        case "experience": return b.experience_years - a.experience_years;
        case "price-low":  return a.hourly_rate - b.hourly_rate;
        case "price-high": return b.hourly_rate - a.hourly_rate;
        default:           return b.average_rating - a.average_rating;
      }
    });

  const tutorRatings = (id: string) => ratings.filter((r) => r.tutor_id === id);

  const starClass = (cls: string | boolean): string =>
    typeof cls === "string" ? cls : cls ? "fas fa-star" : "far fa-star";

  // Recommended = tutors matching parent's subjects/location
  const recommended = currentUser
    ? tutors
        .filter((t) =>
          t.subjects.some((s) => (currentUser.subjects_needed ?? []).includes(s)) ||
          t.location === currentUser.location
        )
        .sort((a, b) => b.average_rating - a.average_rating)
        .slice(0, 4)
    : [];

  const showRecommended = recommended.length > 0 && !query && !subject && !location && !priceRange && !minRating;

  return (
    <div className="tp-page">

      {/* ── Hero search ─────────────────────────────────────────────────────── */}
      <div className="tp-hero">
        <div className="tp-hero-inner">
          <h1 className="tp-hero-title">
            Find the perfect<br />STEM tutor for your child
          </h1>
          <p className="tp-hero-sub">
            Search by subject, name, or location — or let us recommend the best match.
          </p>

          {/* Search bar */}
          <div className="tp-search-wrap">
            <div className="tp-search-box">
              <i className="fas fa-search tp-search-icon" />
              <input
                ref={searchRef}
                type="text"
                className="tp-search-input"
                placeholder='Try "Mathematics JHS 2" or "Science East Legon"…'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button className="tp-search-clear" onClick={() => setQuery("")}>
                  <i className="fas fa-times" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              className={`tp-filter-btn${showFilters ? " active" : ""}`}
              onClick={() => setShowFilters((f) => !f)}
            >
              <i className="fas fa-sliders-h" />
              Filters
              {activeFilterCount > 0 && (
                <span className="tp-filter-badge">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Quick subject pills */}
          <div className="tp-quick-pills">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                className={`tp-quick-pill${subject === s ? " active" : ""}`}
                onClick={() => setSubject(subject === s ? "" : s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter panel ────────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="tp-filter-panel">
          <div className="tp-filter-panel-inner">
            <div className="tp-filter-row">

              <div className="tp-filter-group">
                <label><i className="fas fa-book" /> Subject</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option value="">All Subjects</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="tp-filter-group">
                <label><i className="fas fa-map-marker-alt" /> Location</label>
                <select value={location} onChange={(e) => setLocation(e.target.value)}>
                  <option value="">All Areas</option>
                  {LOCATIONS.slice(0, -1).map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="tp-filter-group">
                <label><i className="fas fa-money-bill-wave" /> Price (GHS/hr)</label>
                <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
                  {PRICE_RANGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div className="tp-filter-group">
                <label><i className="fas fa-star" /> Min Rating</label>
                <select value={minRating} onChange={(e) => setMinRating(e.target.value)}>
                  {RATING_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div className="tp-filter-group">
                <label><i className="fas fa-sort" /> Sort By</label>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                  {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

            </div>

            {activeFilterCount > 0 && (
              <button className="tp-clear-btn" onClick={clearAll}>
                <i className="fas fa-redo" /> Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      <div className="tp-body">

        {/* ── Recommended section ─────────────────────────────────────────── */}
        {showRecommended && (
          <section className="tp-section">
            <div className="tp-section-head">
              <div className="tp-section-title">
                <i className="fas fa-lightbulb" /> Recommended for You
              </div>
              <span className="tp-section-sub">Based on your subjects & location</span>
            </div>
            <div className="tp-cards-grid tp-cards-grid--4">
              {recommended.map((tutor) => (
                <TutorCard
                  key={tutor.id}
                  tutor={tutor}
                  liked={isLiked(tutor.id)}
                  onLike={(e) => handleLike(e, tutor.id)}
                  onBook={(e) => handleBook(e, tutor)}
                  onClick={() => setProfileTutor(tutor)}
                  starClass={starClass}
                  isRecommended
                />
              ))}
            </div>
          </section>
        )}

        {/* ── All tutors ──────────────────────────────────────────────────── */}
        <section className="tp-section">
          <div className="tp-section-head">
            <div className="tp-section-title">
              {query || activeFilterCount > 0
                ? <><i className="fas fa-search" /> Search Results</>
                : <><i className="fas fa-users" /> All Tutors</>
              }
            </div>
            <span className="tp-results-count">
              {filtered.length} tutor{filtered.length !== 1 ? "s" : ""} found
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="tp-empty">
              <div className="tp-empty-icon"><i className="fas fa-search" /></div>
              <h3>No tutors found</h3>
              <p>Try different keywords or adjust your filters.</p>
              <button className="btn btn-outline" onClick={clearAll}>
                <i className="fas fa-redo" /> Clear filters
              </button>
            </div>
          ) : (
            <div className="tp-cards-grid">
              {filtered.map((tutor) => (
                <TutorCard
                  key={tutor.id}
                  tutor={tutor}
                  liked={isLiked(tutor.id)}
                  onLike={(e) => handleLike(e, tutor.id)}
                  onBook={(e) => handleBook(e, tutor)}
                  onClick={() => setProfileTutor(tutor)}
                  starClass={starClass}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Profile modal ────────────────────────────────────────────────────── */}
      {profileTutor && (
        <Modal onClose={() => setProfileTutor(null)} size="lg">
          <div className="prof-banner">
            <div className="prof-avatar-wrap">
              <img src={avatarUrl(profileTutor.full_name, 200)} alt={profileTutor.full_name} />
              {profileTutor.verified && (
                <span className="prof-verified-dot"><i className="fas fa-check" /></span>
              )}
            </div>
            <div className="prof-banner-info">
              <h2 className="prof-name">
                {profileTutor.full_name}
                {profileTutor.verified && (
                  <span className="verified-badge"><i className="fas fa-check-circle" /> Verified</span>
                )}
              </h2>
              <div className="prof-meta">
                <span><i className="fas fa-map-marker-alt" /> {profileTutor.location}</span>
                <span><i className="fas fa-briefcase" /> {profileTutor.experience_years} yrs exp</span>
                <span><i className="fas fa-money-bill-wave" /> GHS {profileTutor.hourly_rate}/hr</span>
                <span><i className="fas fa-clock" /> {profileTutor.response_time_hours}h response</span>
              </div>
              <div className="prof-rating-row">
                <span className="stars">
                  {generateStars(profileTutor.average_rating).map((cls, i) => (
                    <i key={i} className={starClass(cls)} />
                  ))}
                </span>
                <strong>{profileTutor.average_rating.toFixed(1)}</strong>
                <span className="prof-review-cnt">({tutorRatings(profileTutor.id).length} reviews)</span>
              </div>
            </div>
          </div>

          <div className="prof-stats-strip">
            {([
              ["fas fa-chalkboard-teacher", profileTutor.total_sessions,       "Sessions"],
              ["fas fa-heart",              profileTutor.total_likes,           "Saves"],
              ["fas fa-check-double",       `${profileTutor.completion_rate}%`, "Completion"],
              ["fas fa-bolt",               `${profileTutor.response_time_hours}h`, "Response"],
            ] as [string, string|number, string][]).map(([icon, val, label]) => (
              <div key={label} className="prof-stat-item">
                <i className={icon} />
                <span className="prof-stat-val">{val}</span>
                <span className="prof-stat-label">{label}</span>
              </div>
            ))}
          </div>

          <div className="prof-action-row">
            <button className="btn btn-primary prof-book-btn" onClick={() => {
              setProfileTutor(null);
              if (!currentUser) { onLoginRequired(); return; }
              onOpenBooking(profileTutor);
            }}>
              <i className="fas fa-calendar-check" /> Book a Session
            </button>
            <button
              className={`prof-like-btn${isLiked(profileTutor.id) ? " liked" : ""}`}
              onClick={() => { if (!currentUser) { onLoginRequired(); return; } onToggleLike(profileTutor.id); }}
            >
              <i className="fas fa-heart" />
              {isLiked(profileTutor.id) ? "Saved" : "Save Tutor"}
            </button>
          </div>

          <div className="prof-body">
            <div className="prof-section">
              <h3><i className="fas fa-book" /> Subjects</h3>
              <div className="subj-tags">
                {profileTutor.subjects.map((s) => <span key={s} className="subj-tag">{s}</span>)}
              </div>
            </div>
            <div className="prof-section">
              <h3><i className="fas fa-graduation-cap" /> Qualifications</h3>
              <p>{profileTutor.qualifications}</p>
            </div>
            <div className="prof-section">
              <h3><i className="fas fa-user" /> About</h3>
              <p>{profileTutor.bio}</p>
            </div>
            <div className="prof-section">
              <h3><i className="fas fa-star" /> Reviews ({tutorRatings(profileTutor.id).length})</h3>
              {tutorRatings(profileTutor.id).length === 0 ? (
                <p className="prof-no-reviews">No reviews yet — be the first to book!</p>
              ) : (
                <div className="reviews-list">
                  {tutorRatings(profileTutor.id).map((r) => (
                    <div key={r.id} className="review-card">
                      <div className="review-head">
                        <div>
                          <div className="review-author"><i className="fas fa-user-circle" /> Parent Review</div>
                          <span className="stars">
                            {generateStars(r.rating_score).map((cls, i) => (
                              <i key={i} className={starClass(cls)} />
                            ))}
                          </span>
                        </div>
                        <div className="review-date">{formatDate(String(r.review_date))}</div>
                      </div>
                      <p className="review-text">{r.review_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Tutor Card Component ─────────────────────────────────────────────────── */
function TutorCard({
  tutor, liked, onLike, onBook, onClick, starClass, isRecommended = false,
}: {
  tutor: Tutor;
  liked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onBook: (e: React.MouseEvent) => void;
  onClick: () => void;
  starClass: (cls: string | boolean) => string;
  isRecommended?: boolean;
}) {
  return (
    <div className={`tc2-card${isRecommended ? " tc2-card--recommended" : ""}`} onClick={onClick}>

      {/* Top badges */}
      <div className="tc2-badges">
        {tutor.verified && (
          <span className="tc2-badge tc2-badge--verified">
            <i className="fas fa-check-circle" /> Verified
          </span>
        )}
        {isRecommended && (
          <span className="tc2-badge tc2-badge--match">
            <i className="fas fa-lightbulb" /> Match
          </span>
        )}
      </div>

      {/* Save button */}
      <button className={`tc2-save${liked ? " liked" : ""}`} onClick={onLike}>
        <i className="fas fa-heart" />
      </button>

      {/* Avatar */}
      <div className="tc2-avatar-wrap">
        <img src={avatarUrl(tutor.full_name, 160)} alt={tutor.full_name} className="tc2-avatar" />
      </div>

      {/* Info */}
      <div className="tc2-info">
        <div className="tc2-name">{tutor.full_name}</div>
        <div className="tc2-location">
          <i className="fas fa-map-marker-alt" /> {tutor.location}
        </div>

        {/* Rating */}
        <div className="tc2-rating">
          <span className="tc2-stars">
            {generateStars(tutor.average_rating).map((cls, i) => (
              <i key={i} className={starClass(cls)} />
            ))}
          </span>
          <span className="tc2-rating-val">{tutor.average_rating.toFixed(1)}</span>
          <span className="tc2-rating-cnt">({tutor.total_sessions})</span>
        </div>

        {/* Subjects */}
        <div className="tc2-subjects">
          {tutor.subjects.slice(0, 2).map((s) => (
            <span key={s} className="tc2-subj-tag">{s}</span>
          ))}
          {tutor.subjects.length > 2 && (
            <span className="tc2-subj-tag tc2-subj-tag--more">+{tutor.subjects.length - 2}</span>
          )}
        </div>

        {/* Stats row */}
        <div className="tc2-stats">
          <div className="tc2-stat">
            <span className="tc2-stat-val">{tutor.experience_years}y</span>
            <span className="tc2-stat-label">exp</span>
          </div>
          <div className="tc2-stat-divider" />
          <div className="tc2-stat">
            <span className="tc2-stat-val">GHS {tutor.hourly_rate}</span>
            <span className="tc2-stat-label">/hr</span>
          </div>
          <div className="tc2-stat-divider" />
          <div className="tc2-stat">
            <span className="tc2-stat-val">{tutor.response_time_hours}h</span>
            <span className="tc2-stat-label">reply</span>
          </div>
        </div>
      </div>

      {/* Book button */}
      <button className="tc2-book-btn" onClick={onBook}>
        <i className="fas fa-calendar-check" /> Book Session
      </button>

    </div>
  );
}