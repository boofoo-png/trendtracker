import "server-only";

const API = "https://generativelanguage.googleapis.com/v1beta/models";

// "-latest" alias tracks Google's current Flash Lite model (free tier).
// Override with GEMINI_MODEL in .env.local to pin a specific version.
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

/**
 * Ask Gemini for JSON matching `schema` (Gemini's OpenAPI-subset schema format).
 * Throws on network/API errors or unparseable output.
 */
export async function generateJson({ system, prompt, schema, temperature = 0.3 }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set. Add it to .env.local.");

  const call = () =>
    fetch(`${API}/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
    });

  let res = await call();
  // "Overloaded" (503) is usually over in a moment: try once more before giving up.
  if (res.status === 503 || res.status === 500) {
    await new Promise((r) => setTimeout(r, 1500));
    res = await call();
  }

  if (!res.ok) {
    // Full details for the developer's terminal; a plain message for the user.
    const body = await res.text().catch(() => "");
    console.error(`Gemini ${res.status}:`, body.slice(0, 500));
    if (res.status === 429) throw new Error("Sense AI has reached its limit for now. Try again in a minute.");
    if (res.status >= 500) throw new Error("Sense AI is busy right now. Try again in a minute.");
    throw new Error("Sense AI couldn't answer that. Try again.");
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw new Error("Gemini returned an empty response.");
  return JSON.parse(text);
}
