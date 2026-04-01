import { useState } from "react";
import type { Tutor, Rating } from "../../types";
import { avatarUrl } from "../../utils";

interface Props {
  tutor: Tutor;
  parentId: string;
  onClose: () => void;
  onSubmit: (rating: Rating) => void;
}

export default function ReviewModal({ tutor, parentId, onClose, onSubmit }: Props) {
  const [score, setScore]   = useState(0);
  const [hovered, setHover] = useState(0);
  const [text, setText]     = useState("");
  const [error, setError]   = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0)       return setError("Please select a star rating.");
    if (text.trim() === "") return setError("Please write a short review.");

    onSubmit({
      id: `r_${Date.now()}`,
      tutor_id: tutor.id,
      parent_id: parentId,
      rating_score: score,
      review_text: text.trim(),
      review_date: Date.now(),
    });
    onClose();
  };

  const display = hovered || score;
  const labels  = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box sm" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><i className="fas fa-times" /></button>

        {/* Header */}
        <div className="rv-modal-head">
          <img src={avatarUrl(tutor.full_name, 80)} alt={tutor.full_name} className="rv-modal-avatar" />
          <div>
            <div className="rv-modal-title">Rate your session</div>
            <div className="rv-modal-tutor">with {tutor.full_name}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star picker */}
          <div className="rv-stars-wrap">
            <div className="rv-stars">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`rv-star ${n <= display ? "active" : ""}`}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => { setScore(n); setError(""); }}
                >
                  <i className="fas fa-star" />
                </button>
              ))}
            </div>
            <span className="rv-stars-label">{display ? labels[display] : "Tap to rate"}</span>
          </div>

          {/* Review text */}
          <div className="form-group">
            <label><i className="fas fa-pen" /> Your Review</label>
            <textarea
              rows={4}
              placeholder="Share your experience — what went well, what your child learned…"
              value={text}
              onChange={(e) => { setText(e.target.value); setError(""); }}
            />
          </div>

          {error && <p className="rv-error"><i className="fas fa-exclamation-circle" /> {error}</p>}

          <div style={{ display: "flex", gap: ".75rem" }}>
            <button type="button" className="btn btn-secondary btn-block" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-block">
              <i className="fas fa-paper-plane" /> Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}