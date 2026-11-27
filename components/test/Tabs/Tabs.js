"use client";
// Tabs: a row of tab buttons; clicking one shows its panel.
//
// Usage:
//   <Tabs tabs={[
//     { id: "a", label: "Overview", content: <p>...</p> },
//     { id: "b", label: "Details",  content: <p>...</p> },
//   ]} />

import { useState } from "react";
import styles from "./Tabs.module.css";

export default function Tabs({ tabs = [] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId);

  return (
    <div className={styles.tabs}>
      <div role="tablist" className={styles.list}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            className={styles.tab}
            // TODO: set the active tab on click
            // TODO: add styles.active to the selected tab
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className={styles.panel}>
        {active?.content}
      </div>
    </div>
  );
}
