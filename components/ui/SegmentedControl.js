"use client";

export default function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-white p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={`rounded-md px-3 py-1 text-xs ${value === option ? "bg-black/5 font-medium" : "text-ink-500"}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
