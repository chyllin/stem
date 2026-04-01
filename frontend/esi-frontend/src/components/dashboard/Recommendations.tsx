import type { Parent, Tutor } from "../../types";
import { avatarUrl, generateStars } from "../../utils";
import "./Dashboard.css";

interface RecommendationsProps {
  tutors: Tutor[];
  parent: Parent;
  onBook: (tutor: Tutor) => void;
  onViewProfile: (tutor: Tutor) => void;
}

export default function Recommendations({
  tutors,
  parent,
  onBook,
  onViewProfile,
}: RecommendationsProps) {
  const recommended = tutors
    .filter((t) =>
      t.subjects.some((s) => (parent.subjects_needed ?? []).includes(s)) ||
      t.location === parent.location
    )
    .sort((a, b) => b.average_rating - a.average_rating)
    .slice(0, 4);

  return (
    <div className="dash-card full">
      <div className="dash-card-title">
        <i className="fas fa-lightbulb" /> Recommended for You
      </div>
      <p style={{ fontSize: ".88rem", color: "var(--text3)", marginBottom: "1rem" }}>
        Based on your subjects and location
      </p>
      {recommended.length === 0 ? (
        <p style={{ color: "var(--text3)", fontSize: ".88rem" }}>
          Update your profile to receive personalised recommendations.
        </p>
      ) : (
        <div className="rec-grid">
          {recommended.map((t) => (
            <div key={t.id} className="rec-card" onClick={() => onViewProfile(t)}>
              <img className="rec-img" src={avatarUrl(t.full_name, 136)} alt={t.full_name} />
              <div className="rec-name">{t.full_name}</div>
              <div className="rec-loc">{t.location}</div>
              <div className="rec-rating">
                {generateStars(t.average_rating).map((star, i) => (
                  <i
                    key={i}
                    className={typeof star === "string" ? star : star ? "fas fa-star" : "far fa-star"}
                    style={{ color: "var(--accent)", marginRight: 1 }}
                  />
                ))}
                <span style={{ marginLeft: ".25rem", fontSize: ".78rem", color: "var(--text2)" }}>
                  {t.average_rating.toFixed(1)}
                </span>
              </div>
              <button
                className="btn btn-primary btn-sm btn-block"
                onClick={(e) => { e.stopPropagation(); onBook(t); }}
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}