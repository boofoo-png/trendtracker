"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

function PostPreview({ post }) {
  const [playing, setPlaying] = useState(false);
  const stats = [
    post.views ? `${compact.format(post.views)} views` : null,
    post.likes ? `${compact.format(post.likes)} likes` : null,
  ].filter(Boolean);

  return (
    <li className="flex w-[min(72vw,230px)] shrink-0 snap-start flex-col gap-2 rounded-xl border border-sense-blue/10 bg-white/70 p-3">
      {playing && post.embedUrl ? (
        <>
          <iframe
            src={post.embedUrl}
            title={`${post.platform} post: ${post.text || post.id}`}
            className="aspect-[9/16] w-full rounded-md bg-black"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            // allow-popups-to-escape-sandbox: links inside the post ("Visit Instagram",
            // "View profile") open as normal tabs. Without it the new tab inherits the
            // sandbox and Instagram/TikTok refuse to load there.
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
            loading="lazy"
          />
          {/* Some owners turn off embedding, or delete the post after it was scraped. */}
          {post.url && (
            <p className="text-xs leading-[1.4] text-[#4b5d60]">
              Not showing? Some posts can only be viewed on {post.platform}.{" "}
              <a href={post.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sense-blue underline">
                Open it there ↗
              </a>
            </p>
          )}
        </>
      ) : (
        <button
          type="button"
          disabled={!post.embedUrl}
          onClick={() => setPlaying(true)}
          className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-2 rounded-md bg-sense-navy px-4 text-center text-paper disabled:opacity-60"
        >
          <span aria-hidden="true" className="text-3xl">▶</span>
          <span className="text-xs font-semibold">Play preview</span>
          <span className="line-clamp-4 text-[13px] text-paper/75">{post.text}</span>
        </button>
      )}
      <div className="flex items-center justify-between gap-2 text-[13px] text-[#4b5d60]">
        <span>
          {post.platform} · {post.format}
          {stats.length > 0 && ` · ${stats.join(" · ")}`}
        </span>
        {post.url && (
          <a href={post.url} target="_blank" rel="noopener noreferrer" className="shrink-0 underline" title={`Open on ${post.platform}`}>
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
      <p className="py-4 text-center text-sm text-[#4b5d60]">
        {isSample
          ? "Example trends have no posts. Press Find trends above to get real ones with posts."
          : "No posts available for this trend."}
      </p>
    );
  }

  return <PostCarousel trend={trend} posts={posts} />;
}

/** Sideways-scrolling row of posts with arrow buttons, so it's obvious there are more. */
function PostCarousel({ trend, posts }) {
  const rowRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const updateEdges = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    setEdges({
      start: row.scrollLeft <= 4,
      end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    const row = rowRef.current;
    if (!row) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(row);
    return () => observer.disconnect();
  }, [updateEdges, posts.length]);

  // Moves by most of a screenful, leaving part of a card visible for context.
  const scrollBy = (dir) => {
    const row = rowRef.current;
    if (row) row.scrollBy({ left: dir * row.clientWidth * 0.85, behavior: "smooth" });
  };

  const arrow = "absolute top-1/2 z-10 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-sense-blue text-lg font-bold text-paper shadow-[0_6px_16px_rgba(0,31,62,0.3)] transition hover:bg-sense-navy";

  return (
    // w-0 + min-w-full: fills the table cell without widening the table to fit every card.
    <div className="w-0 min-w-full pt-2">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#4b5d60]">Top posts driving {trend.name}</p>
        <p className="shrink-0 text-[13px] text-[#4b5d60]">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
          {!edges.end && " · scroll for more →"}
        </p>
      </div>
      <div className="relative">
        <ul
          ref={rowRef}
          onScroll={updateEdges}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:thin]"
        >
          {posts.map((post) => (
            <PostPreview key={post.id} post={post} />
          ))}
        </ul>
        {!edges.start && (
          <button type="button" aria-label="Previous posts" onClick={() => scrollBy(-1)} className={`${arrow} -left-2`}>
            ‹
          </button>
        )}
        {!edges.end && (
          <button type="button" aria-label="More posts" onClick={() => scrollBy(1)} className={`${arrow} -right-2`}>
            ›
          </button>
        )}
      </div>
    </div>
  );
}
