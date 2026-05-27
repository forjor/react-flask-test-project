import React, { useState } from "react";
import "./CatCard.css";

export default function CatCard({ cat, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(cat.id);
  };

  return (
    <article className="cat-card" data-testid="cat-card" data-cat-id={cat.id}>
      <div className="cat-image-wrapper">
        {imgError ? (
          <div className="cat-image-fallback" aria-label="Image unavailable">
            🐱
          </div>
        ) : (
          <img
            src={cat.image_url}
            alt={cat.name}
            className="cat-image"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}
      </div>
      <div className="cat-info">
        <h2 className="cat-name" data-testid="cat-name">
          {cat.name}
        </h2>
        <p className="cat-date">
          {new Date(cat.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
      <button
        className="delete-btn"
        onClick={handleDelete}
        disabled={deleting}
        aria-label={`Delete ${cat.name}`}
        data-testid="delete-btn"
      >
        {deleting ? "Removing…" : "Remove"}
      </button>
    </article>
  );
}
