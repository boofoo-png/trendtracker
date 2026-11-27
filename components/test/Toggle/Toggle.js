"use client";
// Toggle: an on/off switch.
// It needs useState, so it must be a Client Component ("use client" above).
//
// Usage: <Toggle label="Email alerts" defaultChecked />

import { useState } from "react";
import styles from "./Toggle.module.css";

export default function Toggle({ label, defaultChecked = false, onChange }) {
  const [checked, setChecked] = useState(defaultChecked);

  function handleClick() {
    // TODO: flip `checked` and tell the parent via onChange (if one was passed).
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={styles.toggle}
      onClick={handleClick}
    >
      {/* TODO: the track and the knob. Add styles.on when checked. */}
      <span className={styles.track}>
        <span className={styles.knob} />
      </span>
      <span className={styles.label}>{label}</span>
    </button>
  );
}
