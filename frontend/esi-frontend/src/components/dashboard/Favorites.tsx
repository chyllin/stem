import type { Like, Tutor } from "../../types";
import { avatarUrl } from "../../utils";
import "./Dashboard.css";

interface FavoritesProps {
  likes: Like[];
  tutors: Tutor[];
  parentId: string;
  onBook: (tutor: Tutor) => void;
  onViewProfile: (tutor: Tutor) => void;
}

export default function Favorites({
  likes,
  tutors,
  parentId,
  onBook,
  onViewProfile,
}: FavoritesProps) {
  const favTutorIds = likes
    .filter((l) => l.parent_id === parentId && l.liked)
    .map((l) => l.tutor_id);

  const favTutors = tutors.filter((t) => favTutorIds.includes(t.id));

  return (
    <div className="dash-card">
      <div className="dash-card-title">
        <i className="fas fa-heart" /> Favourite Tutors
      </div>

      {favTutors.length === 0 ? (
        <p style={{ color: "var(--text3)", fontSize: ".88rem" }}>
          No favourites yet. Like tutors to add them here.
        </p>
      ) : (
        favTutors.slice(0, 5).map((t) => (
          <div
            key={t.id}
            className="fav-item"
            onClick={() => onViewProfile(t)}
            style={{ cursor: "pointer" }}
          >
            <div className="fav-inner">
              <img
                className="fav-img"
                src={avatarUrl(t.full_name, 88)}
                alt={t.full_name}
              />
              <div className="fav-info">
                <div className="fav-name">{t.full_name}</div>
                <div className="fav-sub">
                  {t.location} · {t.average_rating.toFixed(1)} ⭐
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onBook(t);
                }}
              >
                Book
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
