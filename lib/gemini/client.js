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

  const res = await fetch(`${API}/${MODEL}:generateContent`, {
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

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Gemini rate limit reached. Try again in a minute.");
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw new Error("Gemini returned an empty response.");
  return JSON.parse(text);
}
