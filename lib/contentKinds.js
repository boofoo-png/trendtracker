// The Content Creation screens (copy from the Marketing Intelligence Hub Figma Make app).
// Shared by the client pages and the server action that validates their input.

export const FIELD_OPTIONS = {
  goal: ["Awareness", "Engagement", "Sales"],
  adGoal: ["Awareness", "Traffic", "Leads", "Sales"],
  tone: ["Professional", "Casual", "Friendly"],
  platform: ["Instagram", "TikTok"],
  format: ["Short-form", "Tutorial", "Product Demo"],
  duration: ["15 seconds", "30 seconds", "1 minute", "3 minutes"],
  adFormat: ["Image Ad", "Video Ad", "Carousel", "Story"],
  contentType: ["Caption", "Ad copy", "Email", "Website copy"],
  platforms: ["Instagram", "Facebook", "TikTok", "Blog"],
  // "Improve your writing" (one screen for posts, ads, emails, website copy and documents)
  writingType: ["Social post", "Ad", "Email", "Website copy", "Other document"],
  intent: ["Improve it", "Rewrite it", "Summarize it", "Get feedback"],
};

export const CONTENT_KINDS = {
  social: {
    card: "Write a new post",
    title: "Write a New Social Post",
    description:
      "Start from scratch: get AI-powered content ideas, captions, and creative guidelines for your next social media post.",
    inputLabel: "Post Details",
    resultLabel: "AI Content Suggestions",
    savedType: "Social post",
    fields: ["goal", "tone", "idea"],
  },
  video: {
    card: "Video",
    title: "Create a Video",
    description:
      "Get AI-powered video concepts, scripts, storyboards, and creative guidelines for your next video.",
    inputLabel: "Video Details",
    resultLabel: "AI Video Suggestions",
    savedType: "Video",
    fields: ["platform", "goal", "format", "duration", "idea"],
  },
  blog: {
    card: "Blog",
    title: "Create a Blog Post",
    description: "Get AI-powered titles, article outlines, and SEO guidance for your next blog post.",
    inputLabel: "Blog Details",
    resultLabel: "AI Blog Suggestions",
    savedType: "Blog post",
    fields: ["tone", "idea"],
  },
  ad: {
    card: "Ad Copy",
    title: "Create Ad Copy",
    description:
      "Get AI-powered headlines, persuasive ad copy, and creative guidelines for your next campaign.",
    inputLabel: "Ad Details",
    resultLabel: "AI Ad Copy Suggestions",
    savedType: "Ad copy",
    fields: ["product", "adGoal", "adFormat", "idea"],
  },
  improve: {
    // Replaces the old "Improve a social post", "Polish any text" and "Upload your file"
    // screens (their URLs redirect here). Saved kind stays "improve".
    card: "Improve your writing",
    title: "Improve your writing",
    description:
      "Upload or paste a post, ad, email or document. Improve it, rewrite it, summarize it or get feedback.",
    inputLabel: "Your writing",
    resultLabel: "AI Suggestions",
    savedType: "Copy",
    fields: ["text", "writingType", "intent", "instructions"],
  },
  repurpose: {
    card: "Repurpose content",
    title: "Repurpose content",
    description: "Turn one piece of content into channel-ready variations.",
    inputLabel: "Source Content",
    resultLabel: "AI Repurposed Content",
    savedType: "Repurposed",
    fields: ["source", "platforms", "instructions"],
    generateLabel: "Enhance with AI",
  },
};
