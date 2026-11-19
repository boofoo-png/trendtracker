export default function SearchInput({ placeholder = "Search", className = "", ...props }) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      className={`w-full rounded-[9px] border border-sense-blue/20 bg-white/65 px-4 py-2 text-sm text-sense-navy outline-none focus:border-sense-blue focus:shadow-[0_0_0_3px_rgba(29,73,144,0.1)] ${className}`}
      {...props}
    />
  );
}
