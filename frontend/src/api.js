const BASE = "/api";

export async function fetchCats() {
  const res = await fetch(`${BASE}/cats`);
  if (!res.ok) throw new Error("Failed to fetch cats");
  return res.json();
}

export async function createCat(name) {
  const res = await fetch(`${BASE}/cats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create cat");
  return res.json();
}

export async function deleteCat(id) {
  const res = await fetch(`${BASE}/cats/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete cat");
  return res.json();
}
