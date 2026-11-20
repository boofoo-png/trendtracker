// Choices for posts in the content calendar (the post editor and the AI planner).

export const POST_FORMATS = ["Image", "Carousel", "Reel", "Video", "Story"];

/** Every half hour from 6:00 AM to 10:00 PM, e.g. "9:30 AM". */
export const POST_TIMES = Array.from({ length: 33 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${((h + 11) % 12) + 1}:${m ? "30" : "00"} ${h < 12 ? "AM" : "PM"}`;
});
