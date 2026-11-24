// Content Creation uploads: pull the plain text out of a Word (.docx) or PDF file so
// the AI tools can work with it. Plain-text files are read in the browser and never
// come here. Signed-in users only; nothing is stored.

import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_CHARS = 12000; // what the AI tools accept (see content-creation/actions.js)

const fail = (error, status = 400) => Response.json({ error }, { status });

export async function POST(request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return fail("Sign in again to upload files.", 401);

  let file;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return fail("Couldn't read the upload. Try again.");
  }
  if (!file || typeof file === "string") return fail("No file was uploaded.");
  if (file.size > MAX_BYTES) return fail(`${file.name} is over 10 MB.`);

  const name = file.name.toLowerCase();
  const buffer = new Uint8Array(await file.arrayBuffer());
  let text = "";
  try {
    if (name.endsWith(".docx")) {
      text = (await mammoth.extractRawText({ buffer: Buffer.from(buffer) })).value;
    } else if (name.endsWith(".pdf")) {
      const pdf = await getDocumentProxy(buffer);
      text = (await extractText(pdf, { mergePages: true })).text;
    } else if (name.endsWith(".doc")) {
      return fail(`${file.name} is an old Word format (.doc). Open it in Word and save it as .docx, then upload that.`);
    } else {
      return fail(`${file.name}: upload a Word (.docx), PDF or text file.`);
    }
  } catch (err) {
    console.error("extract-text failed:", err);
    return fail(`Couldn't read ${file.name}. It may be damaged or password-protected.`);
  }

  text = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) {
    return fail(`${file.name} has no text we can read. If it's a scanned PDF (a picture of a page), copy the text in instead.`);
  }
  const truncated = text.length > MAX_CHARS;
  return Response.json({ text: text.slice(0, MAX_CHARS), truncated });
}
