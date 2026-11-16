export default function SearchInput({ placeholder = "Search", className = "", ...props }) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      className={`w-full rounded-md bg-white px-4 py-2 text-sm ${className}`}
      {...props}
    />
  );
}
