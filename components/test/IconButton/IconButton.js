// IconButton: a button that shows only an icon (e.g. edit, close, copy).
// It reuses the project's existing <Icon> component.
//
// Usage: <IconButton icon="edit" label="Edit post" onClick={...} />

import Icon from "@/components/ui/Icon";
import styles from "./IconButton.module.css";

export default function IconButton({ icon, label, onClick, size = "md" }) {
  // TODO: add a size class (styles.sm / styles.md / styles.lg).
  // TODO: think about a "disabled" prop.
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      // An icon has no visible text, so screen readers need a label.
      aria-label={label}
      title={label}
    >
      <Icon name={icon} />
    </button>
  );
}
