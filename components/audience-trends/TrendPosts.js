"use client";

import { useState } from "react";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

function PostPreview({ post }) {
  const [playing, setPlaying] = useState(false);
  const stats = [
    post.views ? `${compact.format(post.views)} views` : null,
    post.likes ? `${compact.format(post.likes)} likes` : null,
  ].filter(Boolean);

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-sense-blue/10 bg-white/70 p-3">
      {playing && post.embedUrl ? (
        <iframe
          src={post.embedUrl}
          title={`${post.platform} post: ${post.text || post.id}`}
          className="aspect-[9/16] w-full rounded-md bg-black"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
          loading="lazy"
        />
      ) : (
        <button
          type="button"
          disabled={!post.embedUrl}
          onClick={() => setPlaying(true)}
          className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-2 rounded-md bg-sense-navy px-4 text-center text-paper disabled:opacity-60"
        >
          <span aria-hidden="true" className="text-3xl">▶</span>
          <span className="text-xs font-semibold">Play preview</span>
          <span className="line-clamp-4 text-[11px] text-paper/75">{post.text}</span>
        </button>
      )}
      <div className="flex items-center justify-between gap-2 text-[11px] text-ink-500">
        <span>
          {post.platform} · {post.format}
          {stats.length > 0 && ` · ${stats.join(" · ")}`}
        </span>
        {post.url && (
          <a href={post.url} target="_blank" rel="noopener noreferrer" className="shrink-0 underline">
            Open ↗
          </a>
        )}
      </div>
    </li>
  );
}

export default function TrendPosts({ trend, isSample }) {
  const posts = trend.topPosts ?? [];

  if (posts.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-ink-500">
        {isSample
          ? "Post previews appear once live data has been scraped. Press Refresh above."
          : "No posts available for this trend."}
      </p>
    );
  }

  return (
    <div className="pt-2">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
        Top posts driving {trend.name}
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostPreview key={post.id} post={post} />
        ))}
      </ul>
    </div>
  );
}
