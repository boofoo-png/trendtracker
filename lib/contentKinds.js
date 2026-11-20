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
  focus: ["Edit", "Rewrite", "Copy", "Insights"],
};

export const CONTENT_KINDS = {
  social: {
    card: "Social Post",
    title: "Create a Social Post",
    description:
      "Get AI-powered content ideas, captions, and creative guidelines for your next social media post.",
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
  edit: {
    card: "Edit Posts",
    title: "Edit Posts",
    description: "Paste a post and refine it for clarity, structure, and engagement.",
    inputLabel: "Post to Edit",
    resultLabel: "AI Enhanced Suggestions",
    savedType: "Social post",
    fields: ["post", "change", "instructions"],
    generateLabel: "Generate with AI",
  },
  improve: {
    card: "Improve Copy",
    title: "Improve Copy",
    description: "Strengthen tone, messaging, and readability with focused AI suggestions.",
    inputLabel: "Text to Improve",
    resultLabel: "AI Improved Suggestions",
    savedType: "Copy",
    fields: ["contentType", "text", "improve", "instructions"],
    generateLabel: "Improve with AI",
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
  upload: {
    card: "Upload your file",
    title: "Upload your file",
    description: "Bring in an existing draft to edit and enhance with AI.",
    inputLabel: "File Details",
    resultLabel: "AI Suggestions",
    savedType: "Document",
    fields: ["fileText", "focus", "instructions"],
    generateLabel: "Analyze with AI",
  },
};
