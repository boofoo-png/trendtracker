const variants = {
  primary: "bg-teal-900 text-white",
  secondary: "bg-white text-teal-900 border border-black/10",
  ghost: "bg-transparent text-teal-900",
};

export default function Button({ variant = "secondary", className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
