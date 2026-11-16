// Map raw actor items into one common Post shape.

const lower = (s) => String(s ?? "").toLowerCase();
const num = (n) => (Number.isFinite(n) && n > 0 ? n : 0);

const INSTAGRAM_FORMATS = { Video: "Reel", Sidecar: "Carousel", Image: "Image post" };

export function normalizeTikTok(item) {
  return {
    id: `tt-${item.id}`,
    platform: "TikTok",
    text: item.text ?? "",
    hashtags: (item.hashtags ?? []).map((h) => lower(h?.name)).filter(Boolean),
    createdAt: item.createTimeISO ?? (item.createTime ? item.createTime * 1000 : null),
    likes: num(item.diggCount),
    comments: num(item.commentCount),
    shares: num(item.shareCount),
    views: num(item.playCount),
    format: item.isSlideshow ? "Slideshow" : "Short-form video",
    url: item.webVideoUrl ?? null,
    embedUrl: item.id ? `https://www.tiktok.com/embed/v2/${item.id}` : null,
    // The hashtag this post was scraped for.
    queryTag: lower(item.searchHashtag?.name ?? item.input) || null,
  };
}

export function normalizeInstagram(item) {
  return {
    id: `ig-${item.id}`,
    platform: "Instagram",
    text: item.caption ?? "",
    hashtags: (item.hashtags ?? []).map(lower).filter(Boolean),
    createdAt: item.timestamp ?? null,
    likes: num(item.likesCount),
    comments: num(item.commentsCount),
    shares: 0,
    views: num(item.videoViewCount),
    format: INSTAGRAM_FORMATS[item.type] ?? "Post",
    url: item.url ?? null,
    embedUrl: item.shortCode ? `https://www.instagram.com/p/${item.shortCode}/embed` : null,
    // The hashtag this post was scraped for, e.g. ".../explore/tags/luxurytravel".
    queryTag: lower(item.queryTag ?? item.inputUrl?.match(/\/tags\/([^/?#]+)/)?.[1]) || null,
  };
}

export const NORMALIZERS = { TikTok: normalizeTikTok, Instagram: normalizeInstagram };

export const engagementOf = (p) => p.likes + p.comments * 2 + p.shares * 3;
