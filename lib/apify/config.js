// Edit this file to change what the trend tracker scrapes.

// Hashtags are chosen per audience search (Gemini proposes them, the user confirms).
// Hard cap per search, to bound cost.
export const MAX_HASHTAGS_PER_SEARCH = 6;

// Rough Apify cost per scraped post (USD), measured on the first run in Nov 2026.
// Only used to show an estimate before a search runs.
export const EST_COST_PER_POST = { TikTok: 0.0037, Instagram: 0.0026 };

// Cost guard: posts fetched per hashtag, per platform, per refresh.
export const RESULTS_PER_HASHTAG = 30;

// A hashtag needs at least this many matching posts to show up as a trend.
export const MIN_POSTS_PER_TREND = 3;

// Example posts kept per trend (most engaging first), shown in a scrollable row.
export const TOP_POSTS_PER_TREND = 12;

export const ACTORS = {
  TikTok: {
    id: "clockworks~tiktok-scraper",
    input: (hashtags) => ({
      hashtags,
      resultsPerPage: RESULTS_PER_HASHTAG,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSlideshowImages: false,
      shouldDownloadAvatars: false,
      shouldDownloadMusicCovers: false,
    }),
  },
  Instagram: {
    id: "apify~instagram-hashtag-scraper",
    input: (hashtags) => ({
      hashtags,
      resultsType: "posts",
      resultsLimit: RESULTS_PER_HASHTAG,
    }),
  },
};
