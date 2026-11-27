// Badge: a small label like "New", "Trending" or "3".
// No state, so this one can stay a Server Component (no "use client").
//
// Usage: <Badge variant="success">Trending</Badge>

import styles from "./Badge.module.css";

export default function Badge({ children, variant = "default" }) {
  // TODO: combine the base class with a variant class.
  // Hint: className={`${styles.badge} ${styles[variant]}`}
  return <span className={styles.badge}>{children}</span>;
}
