const variants = {
  primary: "bg-sense-blue text-paper hover:bg-sense-blue/85",
  secondary: "border border-sense-blue/20 bg-white/70 text-sense-blue hover:bg-sense-blue/10",
  ghost: "bg-transparent text-sense-blue hover:bg-sense-blue/10",
};

export default function Button({ variant = "secondary", className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center gap-2 rounded-[18px] px-4 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
