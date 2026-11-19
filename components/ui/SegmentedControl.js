"use client";

// Pill toggle matching Toggle in ui/Dashboard.js.
export default function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[24px] border border-sense-blue/15 bg-white/70 p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={`cursor-pointer rounded-[19px] px-3.5 py-1.5 text-[11px] font-semibold transition-colors ${
            value === option ? "bg-sense-blue text-paper" : "text-sense-navy hover:bg-sense-blue/10"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
