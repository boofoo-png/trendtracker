"use server";

// Sense AI assistant: called when the marketer presses Ask (or picks a suggested question).

import { getLatestTrends } from "@/lib/trendStore";
import { businessContext } from "@/lib/business";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { askSenseAI } from "@/lib/gemini/assistant";
import { getSavedFacts } from "@/app/actions/performance";
import { SENSE_ROUTES } from "@/lib/assistant/shared";

const clip = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const list = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);

function cleanMessages(raw) {
  const msgs = list(raw, 12)
    .map((m) => ({ role: m?.role === "assistant" ? "assistant" : "user", text: clip(m?.text, 1200) }))
    .filter((m) => m.text);
  return msgs.at(-1)?.role === "user" ? msgs.slice(-10) : [];
}

async function trendSummary() {
  try {
    const { trends = [], updatedAt, audiences = [] } = await getLatestTrends();
    if (!trends.length) {
      return "TRENDS: No trend search has been run yet, so the Audience page is showing example trends only.";
    }
    const top = [...trends]
      .sort((a, b) => b.momentum - a.momentum)
      .slice(0, 10)
      .map((t) => `- ${t.name} (${t.platform}, ${t.format}): momentum ${t.momentum}/100, weekly change ${t.change >= 0 ? "+" : ""}${t.change}%, ${t.postCount ?? "?"} posts`);
    const when = updatedAt ? new Date(updatedAt).toDateString() : "unknown date";
    return [
      `TRENDS (real data from the latest Instagram/TikTok scrape, ${when}${audiences.length ? `, searched for: ${audiences.join(", ")}` : ""}):`,
      ...top,
    ].join("\n");
  } catch {
    return "TRENDS: Trend data couldn't be loaded right now.";
  }
}

/** Real numbers from the connected Instagram and tracked competitors (saved; no live calls). */
async function accountSummary() {
  const lines = [
    "NOT CONNECTED: no ad spend, revenue, sales, website or email data. Never quote or invent figures for these.",
  ];
  try {
    const f = await getSavedFacts();
    const fmt = (v, d = 1) => (v == null ? "unknown" : Number(v).toFixed(d));
    if (!f.connected) {
      lines.unshift("INSTAGRAM: not connected yet (Settings → Connected accounts). There are no real performance numbers yet.");
      return lines.join("\n");
    }
    lines.unshift(
      f.me
        ? `YOUR INSTAGRAM (@${f.me.username}, real): ${f.me.followers} followers; ${fmt(f.me.postsPerWeek)} posts a week; ` +
            `about ${f.me.avgLikes ?? "?"} likes and ${f.me.avgComments ?? "?"} comments per post; engagement ${fmt(f.me.engagementRate, 2)}%; mostly posts ${f.me.topFormat ?? "?"}s.`
        : "YOUR INSTAGRAM: connected, numbers not loaded yet (they appear after opening Competitors, Overview or Reports).",
    );
    lines.splice(
      1,
      0,
      f.competitors.length
        ? `TRACKED COMPETITORS (real, Instagram):\n${f.competitors
            .map((c) => `- @${c.handle}: ${c.followers} followers, ${fmt(c.postsPerWeek)} posts/week, engagement ${fmt(c.engagementRate, 2)}%, mostly ${c.topFormat ?? "?"}s`)
            .join("\n")}`
        : "TRACKED COMPETITORS: none yet (Competitors page).",
    );
  } catch {
    lines.unshift("ACCOUNT DATA: couldn't be loaded right now.");
  }
  return lines.join("\n");
}

function browserSummary(c) {
  const lines = [];
  const page = SENSE_ROUTES[c?.page] ?? clip(c?.page, 60);
  if (page) lines.push(`The marketer is currently on: ${page}.`);
  const audiences = list(c?.audiences, 5).map((a) => clip(a, 60)).filter(Boolean);
  lines.push(audiences.length ? `Selected audiences: ${audiences.join(", ")}.` : "No audiences selected yet.");

  const posts = list(c?.upcomingPosts, 6).map((p) => `- ${clip(p.date, 12)} ${clip(p.time, 10)} ${clip(p.channel, 30)}: ${clip(p.title, 90)}`);
  lines.push(posts.length ? `UPCOMING CALENDAR POSTS:\n${posts.join("\n")}` : "CONTENT CALENDAR: nothing scheduled.");

  const saved = list(c?.savedContent, 10).map((s) => `- [${clip(s.type, 20)}] ${clip(s.title, 90)}`);
  lines.push(saved.length ? `SAVED IN MY CONTENT (newest first):\n${saved.join("\n")}` : "MY CONTENT: nothing saved yet.");

  if (c?.campaign?.name) {
    lines.push(
      `CURRENT CAMPAIGN DRAFT: "${clip(c.campaign.name, 80)}". ${clip(c.campaign.coreMessage, 160)} ` +
        `Goal: ${clip(c.campaign.goal, 20)}. Audience: ${clip(c.campaign.audience, 100)}.`,
    );
  }
  return lines.join("\n");
}

/** messages: [{ role, text }], latest last. client: what the browser knows (see SenseAssistant). */
export async function askSense(messages, client, business) {
  if (!isGeminiConfigured()) return { error: "Sense AI is off: add GEMINI_API_KEY to .env.local." };
  const clean = cleanMessages(messages);
  if (!clean.length) return { error: "Type a question first." };

  const workspace = [
    `Today is ${new Date().toDateString()}.`,
    browserSummary(client),
    await trendSummary(),
    await accountSummary(),
  ].join("\n\n");

  try {
    const reply = await askSenseAI({ messages: clean, workspace, context: businessContext(business) });
    if (!reply.answer) return { error: "Sense AI didn't return an answer. Try asking again." };
    return { reply };
  } catch (err) {
    return { error: err.message || "Sense AI couldn't answer right now." };
  }
}
