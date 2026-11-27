"use client";
// Dropdown: a button that opens a list of options.
//
// Usage:
//   <Dropdown
//     label="Platform"
//     options={["Instagram", "TikTok", "LinkedIn"]}
//     onSelect={(value) => console.log(value)}
//   />

import { useState } from "react";
import styles from "./Dropdown.module.css";

export default function Dropdown({ label, options = [], onSelect }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  function choose(option) {
    // TODO: save the choice, close the menu, call onSelect
  }

  return (
    <div className={styles.dropdown}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        // TODO: toggle `open` on click
      >
        {selected ?? label}
      </button>

      {/* TODO: only render the menu when `open` is true */}
      <ul className={styles.menu}>
        {options.map((option) => (
          <li key={option}>
            <button type="button" className={styles.option} onClick={() => choose(option)}>
              {option}
            </button>
          </li>
        ))}
      </ul>

      {/* Stretch goals: close on Escape, close when clicking outside. */}
    </div>
  );
}
