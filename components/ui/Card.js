import Eyebrow from "./Eyebrow";

export default function Card({ eyebrow, title, aside, className = "", children }) {
  return (
    <section className={`rounded-xl border border-white/40 bg-white/70 p-5 backdrop-blur-md ${className}`}>
      {(eyebrow || title || aside) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="text-lg font-medium">{title}</h2>}
          </div>
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}
