import React, { useState } from "react";
import "./AddCatForm.css";

const SUGGESTED_NAMES = [
  "Whiskers",
  "Luna",
  "Mochi",
  "Shadow",
  "Pumpkin",
  "Mittens",
  "Cleo",
  "Noodle",
];

function randomName() {
  return SUGGESTED_NAMES[Math.floor(Math.random() * SUGGESTED_NAMES.length)];
}

export default function AddCatForm({ onAdd, loading }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const catName = name.trim() || randomName();
    onAdd(catName);
    setName("");
  };

  return (
    <form className="add-cat-form" onSubmit={handleSubmit} data-testid="add-cat-form">
      <input
        type="text"
        className="name-input"
        placeholder="Cat name (optional — we'll pick one)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
        maxLength={60}
        data-testid="cat-name-input"
        aria-label="Cat name"
      />
      <button
        type="submit"
        className="add-btn"
        disabled={loading}
        data-testid="add-cat-btn"
      >
        {loading ? "Adding…" : "Add Cat"}
      </button>
    </form>
  );
}
