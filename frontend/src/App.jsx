import React, { useState, useEffect, useCallback } from "react";
import CatCard from "./components/CatCard.jsx";
import AddCatForm from "./components/AddCatForm.jsx";
import { fetchCats, createCat, deleteCat } from "./api.js";
import "./App.css";

export default function App() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const loadCats = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchCats();
      setCats(data);
    } catch (err) {
      setError("Could not load cats. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCats();
  }, [loadCats]);

  const handleCreate = async (name) => {
    setCreating(true);
    try {
      const newCat = await createCat(name);
      setCats((prev) => [newCat, ...prev]);
    } catch {
      setError("Failed to create cat.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCat(id);
      setCats((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Failed to delete cat.");
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🐱 Cat Gallery</h1>
        <p className="subtitle">Your personal collection of cats</p>
      </header>

      <main className="app-main">
        <section className="add-section" aria-label="Add a cat">
          <AddCatForm onAdd={handleCreate} loading={creating} />
        </section>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <section className="gallery-section" aria-label="Cat gallery">
          {loading ? (
            <p className="status-text">Loading cats...</p>
          ) : cats.length === 0 ? (
            <p className="status-text empty-state" data-testid="empty-state">
              No cats yet — add one above!
            </p>
          ) : (
            <div className="cat-grid" data-testid="cat-grid">
              {cats.map((cat) => (
                <CatCard key={cat.id} cat={cat} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
