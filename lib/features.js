// Feature switches. Safe to import from server and client code.

// Audience fit is turned off until its scoring is reliable. When false:
// the Fit column is hidden, advice uses momentum only, and trend searches
// skip the Gemini fit-scoring step. Set to true to bring it all back.
export const FIT_ENABLED = false;
