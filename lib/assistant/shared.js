// Sense AI assistant: definitions shared by the drawer (client) and the server action.

/** Pages the assistant may send the user to. */
export const SENSE_ROUTES = {
  "/overview": "Overview",
  "/audience-trends": "Audience trends",
  "/competitors": "Competitors",
  "/content-creation": "Content Creation",
  "/content-creation/social": "Social post creator",
  "/content-creation/video": "Video creator",
  "/content-creation/blog": "Blog creator",
  "/content-creation/ad": "Ad copy creator",
  "/content-creation/campaign": "Campaign builder",
  "/content-creation/my-content": "My Content",
  "/ai-management": "AI content calendar",
  "/reports": "Reports",
  "/settings": "Settings",
};

/** Creators an idea can be handed to ("create" actions). */
export const SENSE_CREATORS = [
  "/content-creation/social",
  "/content-creation/video",
  "/content-creation/blog",
  "/content-creation/ad",
  "/content-creation/campaign",
];

export const STARTER_PROMPTS = [
  "What is gaining momentum right now?",
  "What content should we create next?",
  "How are competitors performing?",
];

export const SENSE_EVENT = "trendtracker:open-sense";

/** Open the assistant from anywhere, optionally asking `question` straight away. */
export function openSense(question) {
  window.dispatchEvent(new CustomEvent(SENSE_EVENT, { detail: { question: question ?? "" } }));
}
