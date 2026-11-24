// Building blocks shared by the Overview, Competitors and Reports screens
// (styles from the Marketing Intelligence Hub Figma Make app).

export const isNegative = (change) => String(change ?? "").startsWith("-");

/** Lime pill for a positive change, coral for a negative one. */
export function Change({ value, className = "" }) {
  if (value == null) return null;
  return (
    <span
      className={`whitespace-nowrap rounded-[18px] px-2.5 py-[5px] text-xs font-bold text-sense-navy ${
        isNegative(value) ? "bg-[#ff7f7f]" : "bg-sense-lime"
      } ${className}`}
    >
      {value}
    </span>
  );
}

/** Paper card with the Make app's stacked drop shadow. */
export function Panel({ as: Tag = "article", className = "", children }) {
  return (
    <Tag
      className={`min-w-0 rounded-[22px] border border-paper/60 bg-paper/95 p-5 text-sense-navy shadow-[0_6px_0_rgba(0,31,62,0.16),0_18px_30px_rgba(0,31,62,0.1)] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Eyebrow({ className = "text-[#4b5d60]", children }) {
  return (
    <p className={`mb-[5px] text-[11px] font-bold uppercase tracking-[0.11em] ${className}`}>{children}</p>
  );
}

export function PanelHeading({ eyebrow, title, subtitle, aside }) {
  return (
    <div className="flex items-start justify-between gap-3.5">
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h3 className="text-[17px] font-bold text-sense-blue">{title}</h3>
        {subtitle && <p className="mt-1 text-[13px] text-[#4b5d60]">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}

/** Page title in paper on the gradient background. */
export function PageTitle({ eyebrow, title, description, children }) {
  return (
    <header className="mb-[18px] flex flex-col items-start justify-between gap-5 text-paper sm:flex-row sm:items-end">
      <div className="max-w-[760px]">
        {eyebrow && <Eyebrow className="text-paper">{eyebrow}</Eyebrow>}
        <h1 className="text-[clamp(27px,3vw,38px)] font-medium tracking-[-0.04em]">{title}</h1>
        {description && <p className="mt-2 text-[13px] leading-[1.6] text-paper/85">{description}</p>}
      </div>
      {children}
    </header>
  );
}

/** Pill toggle, e.g. 7 days / 30 days. */
export function Toggle({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 rounded-[24px] bg-paper/80 p-1">
      {options.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={value === item}
          onClick={() => onChange(item)}
          className={`min-w-16 cursor-pointer rounded-[19px] px-3.5 py-2 text-xs font-semibold transition-colors ${
            value === item ? "bg-sense-blue text-paper" : "text-sense-navy hover:bg-sense-blue/10"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
