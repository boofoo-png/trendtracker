import Eyebrow from "./Eyebrow";

// Paper card with the Figma Make drop shadow (same look as Panel in ui/Dashboard.js).
export default function Card({ eyebrow, title, aside, className = "", children }) {
  return (
    <section
      className={`rounded-[22px] border border-paper/60 bg-paper/95 p-5 text-sense-navy shadow-[0_6px_0_rgba(0,31,62,0.16),0_18px_30px_rgba(0,31,62,0.1)] sm:p-6 ${className}`}
    >
      {(eyebrow || title || aside) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="text-[17px] font-bold text-sense-blue">{title}</h2>}
          </div>
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}
