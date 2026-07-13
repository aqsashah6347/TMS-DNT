export default function TeamGlassCard({ onClick, className = "", front, back }) {
  return (
    <div
      onClick={onClick}
      className={`team-flip-card ${onClick ? "team-flip-card--clickable" : ""} ${className}`}
    >
      <div className="team-flip-card__inner">
        <div className="team-flip-card__face team-flip-card__face--front">
          <span className="team-flip-card__blob" aria-hidden="true" />
          <div className="team-flip-card__face-content">{front}</div>
        </div>
        <div className="team-flip-card__face team-flip-card__face--back">
          <div className="team-flip-card__face-content">{back}</div>
        </div>
      </div>
    </div>
  );
}

