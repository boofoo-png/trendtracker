/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      // Run Tailwind on every stylesheet, but keep *.module.css files as
      // CSS Modules (renaming them to *.css would make them global).
      "*.css": [
        {
          condition: { path: /\.module\.css$/ },
          loaders: ["@tailwindcss/turbopack"],
          as: "*.module.css",
        },
        {
          condition: { not: { path: /\.module\.css$/ } },
          loaders: ["@tailwindcss/turbopack"],
          as: "*.css",
        },
      ],
    },
  },
};

export default nextConfig;
