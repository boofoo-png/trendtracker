"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "trendtracker:audiences";
const norm = (s) => s.trim().toLowerCase();

function persist(saved, selected) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ saved, selected }));
  } catch {}
}

/** Saved + selected audiences, kept in this browser. No network calls. */
export default function useAudiences() {
  const [saved, setSaved] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (stored?.saved?.length) {
        // Read after mount so server and client markup match on hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSaved(stored.saved);
        setSelected((stored.selected ?? []).filter((s) => stored.saved.includes(s)));
      }
    } catch {}
  }, []);

  const update = (nextSaved, nextSelected) => {
    setSaved(nextSaved);
    setSelected(nextSelected);
    persist(nextSaved, nextSelected);
  };

  const addAudience = (name) => {
    const clean = name.replace(/\s+/g, " ").trim().slice(0, 60);
    if (!clean) return;
    const existing = saved.find((s) => norm(s) === norm(clean));
    const label = existing ?? clean;
    update(
      existing ? saved : [...saved, clean],
      selected.includes(label) ? selected : [...selected, label],
    );
  };

  const removeAudience = (name) =>
    update(saved.filter((s) => s !== name), selected.filter((s) => s !== name));

  const toggleAudience = (name) =>
    update(
      saved,
      selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name],
    );

  return {
    savedAudiences: saved,
    audiences: selected,
    addAudience,
    removeAudience,
    toggleAudience,
  };
}
