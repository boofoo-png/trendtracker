# TrendTracker: the SixthSense marketing dashboard

A Next.js 16 (App Router) + Tailwind CSS v4 build of the **SixthSense** marketing dashboard. It started as the **Audience Trends** screen and now covers the whole app: Overview, Audience, Competitors, Content Creation, AI Management (content calendar), Reports and Settings, plus the **Sense AI** assistant.

What a marketer can do:
1. **Describe their business** once (Settings → Workspace). Every AI request is tailored to it.
2. **Find trends.** Pick audiences, then scrape **TikTok and Instagram** through **Apify** and review the ranked trends and top posts.
3. **Turn trends into content.** Use **Google Gemini Flash Lite** to write campaign direction, social posts, videos, blogs, ad copy and full campaign plans, and save the results to **My Content**.
4. **Plan posting.** Generate a two-week posting plan and manage it in a content calendar.
5. **Ask Sense AI** questions about their trends, calendar, content and performance.

**Nothing that costs money or calls an AI model runs automatically.** Every Apify scrape and every Gemini call starts from a button press.

> **Note:** This repo uses Next.js 16, which has breaking changes from earlier versions. Check `node_modules/next/dist/docs/` before relying on older conventions (see `AGENTS.md`).

---

## Contents

1. [Status](#1-status)
2. [Getting started](#2-getting-started)
3. [Pages](#3-pages)
4. [Architecture](#4-architecture)
5. [File structure](#5-file-structure)
6. [Server actions](#6-server-actions)
7. [Business profile](#7-business-profile)
8. [Audience trends in depth](#8-audience-trends-in-depth)
9. [Apify integration](#9-apify-integration)
10. [Gemini integration](#10-gemini-integration)
11. [Sense AI assistant](#11-sense-ai-assistant)
12. [Handing ideas between pages](#12-handing-ideas-between-pages)
13. [Sample data, date ranges and charts](#13-sample-data-date-ranges-and-charts)
14. [Client state and persistence](#14-client-state-and-persistence)
15. [Design tokens and shared UI](#15-design-tokens-and-shared-ui)
16. [Accessibility](#16-accessibility)
17. [Configuration reference](#17-configuration-reference)
18. [Known limitations and next steps](#18-known-limitations-and-next-steps)

---

## 1. Status

| Area | Status | Data source |
| ---- | ------ | ----------- |
| App shell: sidebar, top bar, phone menu, 404 page | ✅ Built | — |
| Sense AI assistant (drawer) | ✅ Built | Gemini + workspace summary |
| Overview | ✅ Built | Sample data, by date range |
| Audience trends | ✅ Built | Apify (live) + Gemini |
| Competitors | ✅ Built | Placeholder campaigns |
| Content Creation: 8 creators | ✅ Built | Gemini |
| Content Creation: Campaign builder | ✅ Built | Gemini |
| Content Creation: My Content | ✅ Built | Browser storage |
| AI Management: content calendar + AI planner | ✅ Built | Gemini + browser storage |
| Reports | ✅ Built | Sample data, by date range |
| Settings: profile, workspace, notifications | ✅ Built | Browser storage |
| Audience fit scoring | ⏸ Turned off | `FIT_ENABLED = false`; see [§8](#8-audience-trends-in-depth) |
| Accounts, database, real ad/analytics/competitor data | ⬜ Not started | — |

---

## 2. Getting started

```bash
npm install
npm run dev      # http://localhost:3000 (redirects to /overview)
npm run build && npm start
npm run lint
```

### Environment variables

Create `.env.local` in the project root. Git ignores all `.env*` files, so keys never reach source control. They're only read by server code, so they're never sent to the browser.

```bash
# Apify: https://console.apify.com/settings/integrations
APIFY_TOKEN=apify_api_...

# Google Gemini (free tier): https://aistudio.google.com/apikey
GEMINI_API_KEY=...
# Optional: pin a model. The default alias always points to the current Flash Lite model.
# GEMINI_MODEL=gemini-flash-lite-latest
```

Restart `npm run dev` after changing `.env.local`.

**Running without keys:**
- **No `APIFY_TOKEN`:** the Audience page shows built-in sample trends, and trend searches fail with a clear error.
- **No `GEMINI_API_KEY`:** everything that isn't AI still works (preset audiences, calendar editing, My Content, Settings, sample dashboards). Every AI button returns "AI features are off: add GEMINI_API_KEY to .env.local." and Sense AI says it's off.

### First run

Open **Settings → Workspace** (or click the company pill in the top bar) and fill in the business profile: company, industry, customers, a short description and a few keywords. The Audience presets, the "Interest in your topics" card and every Gemini prompt use it.

---

## 3. Pages

| Route | Page | What it does |
| ----- | ---- | ------------ |
| `/` | — | Redirects to `/overview` |
| `/overview` | **Marketing Overview** | Competitor watch, interest in your topics, new followers, engagement rate, best day to post next, and channel comparison for the chosen date range |
| `/audience-trends` | **Audience** | Choose audiences → find hashtags → scrape TikTok + Instagram → ranked trends, radar, watchlist, post previews, campaign direction |
| `/competitors` | **Competitor performance** | Three benchmark campaigns, filterable by finding ("Most viewed post", "Most liked post", …), each with a comparison and a "Your next move" action plan |
| `/content-creation` | **Content Creation** | Cards for "Create new AI-guided content" and "Edit and enhance existing content" |
| `/content-creation/social` · `video` · `blog` · `ad` | Creators | Fill in a short form, generate with Gemini, copy or save the result |
| `/content-creation/edit` · `improve` · `repurpose` · `upload` | Editors | Paste or upload existing text and have Gemini edit, improve, repurpose or analyse it |
| `/content-creation/campaign` | **Campaign builder** | An 8-step brief → a full campaign plan (strategy, channel plan, timeline, starter content, measurement) |
| `/content-creation/my-content` | **My Content** | Everything saved from the creators, plus posts planned in the calendar; search, filter by type, copy, delete |
| `/ai-management` | **AI content planner** | Month calendar of planned posts, add/edit posts by hand, or answer three questions to get a two-week AI posting plan |
| `/reports` | **Insights / Reports** | KPIs, Google vs Meta revenue chart, AI insights summary, performance by country, top campaigns, platform efficiency |
| `/settings` | **Profile and settings** | Tabs: Profile, Workspace (business profile), Notifications (alert types) |
| anything else | **404** | "Page not found" inside the app shell, with links to every page |

### App shell (`components/shell/`)

- **Sidebar** (desktop, `lg` and up): Sixth Sense logo, the six nav items from `nav.js`, a Settings gear and the **?** button that opens Sense AI.
- **Phone menu** (`MobileNav.js`, below `lg`): a menu button in the top bar that opens the same navigation as a drawer.
- **Top bar** (`TopBar.js`):
  - **Search pill** that jumps to any screen (Enter ↵). Anything typed can also be sent to Sense AI as a question.
  - **Alerts bell** with an unread count. The alert types shown follow Settings → Notifications, and "read" state is remembered in this browser.
  - **Company pill** (avatar + company name from Settings). Clicking it opens the business profile pop-up (`BusinessProfileDialog`).
- **404 page** (`app/not-found.js`) renders inside the same shell.

---

## 4. Architecture

```
Browser (Client Components)                    Server                                  External
───────────────────────────                    ──────                                  ────────
AppShell: Sidebar · TopBar · MobileNav
  └ SenseAssistant ── askSense() ───────────► app/actions/assistant.js ─► lib/gemini ─► Gemini API
                                                 └ getLatestTrends() ───────────────► Apify KV store
Audience:  AudienceTrendsView ─ useTrendFilters
  ├ AudienceSelector ── suggestAudiences() ─► audience-trends/actions.js ─► lib/gemini ─► Gemini
  │  └ TrendSearchPanel ─ planTrendSearch() ─►                          ─► lib/gemini
  │                      runTrendSearch() ──►                          ─► lib/apify ──► Apify actors
  ├ TrendTable / TrendPosts ──────────────────────────────── iframe embeds ───────────► TikTok / Instagram
  └ CampaignDirection ─ generateCampaignDirection() ─►                  ─► lib/gemini ─► Gemini
Content:   CreatorPage ─ generateContent() ──► content-creation/actions.js ─► lib/gemini ─► Gemini
           CampaignPage ─ generateCampaign() ─►
AI Mgmt:   AIManagementPage ─ createPostingPlan() ─► ai-management/actions.js ─► lib/gemini ─► Gemini
Overview / Reports / Competitors: sample data computed in the browser (lib/sample)

Browser storage (localStorage / sessionStorage): settings, audiences, watchlist, calendar,
saved content, campaign draft, date range, alerts read, page-to-page handoffs
```

- **Server and client split.** `app/(dashboard)/layout.js` wraps every page in `AppShell`. The Audience page is a Server Component that loads the latest saved trend result inside `<Suspense>`; the other pages are thin Server Components that render one `"use client"` page component.
- **Server Actions** are the only way the browser reaches Apify or Gemini. They check and trim every input, cap list lengths, and return `{ …, error }` objects instead of throwing.
- **Business profile.** Every action that calls Gemini takes a `business` argument (the Settings → Workspace profile from the browser). The server re-validates it with `cleanBusiness()` and turns it into a system-prompt paragraph with `businessContext()`. See [§7](#7-business-profile).
- **`server-only`** guards `lib/apify/client.js`, `lib/apify/getTrends.js` and `lib/gemini/*`, so importing them into client code fails the build.
- **Caching** uses Next 16 Cache Components (`cacheComponents: true` and `partialPrefetching: true` in `next.config.mjs`):
  - `getLatestTrends` uses `"use cache"` + `cacheLife("minutes")` + `cacheTag("apify-trends")`. `runTrendSearch` calls `updateTag("apify-trends")` after saving, so the next load reads fresh data.
  - The Audience-page Gemini helpers use `"use cache"` keyed by their arguments (including the business context): suggestions, hashtags and campaign directions for days, fit for hours.
  - Content, campaign-plan, posting-plan and Sense AI calls are **not** cached, so each press gives a fresh answer.
- **Today's date** is only read in the browser (`useToday()` in `lib/calendar.js`), because with `cacheComponents` Next.js prerenders client components and doesn't allow reading the current time there. Pages that depend on today, or on browser-saved data, show `Skeleton` placeholders until the browser takes over (`useHydrated()`).

---

## 5. File structure

```
app/
├── layout.js                          # Montserrat font, metadata, <html>/<body>
├── globals.css                        # Tailwind import, design tokens (@theme), page background
├── page.js                            # redirect("/overview")
├── not-found.js                       # 404 inside AppShell
├── actions/
│   └── assistant.js                   # "use server": askSense (Sense AI)
└── (dashboard)/
    ├── layout.js                      # <AppShell>{children}</AppShell>
    ├── overview/page.js
    ├── audience-trends/
    │   ├── page.js                    # PageHeader + <Suspense><LiveTrends/></Suspense>
    │   └── actions.js                 # suggestAudiences, planTrendSearch, runTrendSearch, generateCampaignDirection
    ├── competitors/page.js
    ├── content-creation/
    │   ├── page.js                    # landing page (cards)
    │   ├── actions.js                 # generateContent, generateCampaign
    │   ├── social/ video/ blog/ ad/   # <CreatorPage kind="…">
    │   ├── edit/ improve/ repurpose/ upload/
    │   ├── campaign/page.js           # Campaign builder
    │   └── my-content/page.js         # My Content library
    ├── ai-management/
    │   ├── page.js
    │   └── actions.js                 # createPostingPlan
    ├── reports/page.js
    └── settings/page.js

components/
├── shell/
│   ├── AppShell.js                    # Sidebar + TopBar + <main>, plus SenseAssistant and ContentTrendWatcher
│   ├── Sidebar.js · NavItem.js · UtilityLink.js · nav.js
│   ├── MobileNav.js                   # phone/tablet drawer menu
│   ├── TopBar.js                      # search, alerts bell, company pill
│   ├── SenseAssistant.js              # Sense AI drawer
│   ├── SenseButton.js                 # sidebar "?" button
│   ├── ContentTrendWatcher.js         # clears stale page-to-page handoffs
│   └── NotFoundPage.js
├── ui/
│   ├── Dashboard.js                   # Panel, PageTitle, change pills, Toggle (shared by dashboards)
│   ├── Card.js                        # paper card with eyebrow / title / aside slots
│   ├── PeriodPicker.js                # 7 / 30 / 90 days / Custom range
│   ├── InfoTip.js                     # ⓘ explanation popover (portal)
│   ├── Icon.js                        # outline icon set
│   ├── Skeleton.js                    # loading placeholders
│   ├── AdviceBadge.js · Sparkline.js · SegmentedControl.js
│   └── Button.js · SearchInput.js · Eyebrow.js   # not used at the moment
├── overview/OverviewDashboard.js
├── audience-trends/
│   ├── AudienceTrendsView.js          # "use client" wrapper; spreads useTrendFilters state
│   ├── PageHeader.js · LiveStatusBanner.js
│   ├── AudienceSelector.js            # search combobox, AI suggest, saved chips, source filter
│   ├── TrendSearchPanel.js            # Find trends → confirm hashtags + cost → run
│   ├── TrendTable.js · TrendRow.js · TrendPosts.js
│   ├── TrendRadar.js · Watchlist.js · HowToRead.js
│   └── CampaignDirection.js · CampaignFocusForm.js · ContentAngleCard.js
├── competitors/CompetitorsDashboard.js
├── content-creation/
│   ├── ContentCreationDashboard.js    # landing page
│   ├── CreatorPage.js                 # forms + results for all 8 creators
│   ├── CampaignPage.js                # brief form + generated plan
│   ├── MyContentPage.js               # saved content + planned posts
│   └── ui.js                          # BackLink, UploadZone, GenerateButton, CopyButton, Tabs, …
├── ai-management/
│   ├── AIManagementPage.js            # calendar, plan form, plan review
│   └── PostEditor.js                  # add / edit post pop-up
├── reports/
│   ├── ReportsDashboard.js
│   └── RevenueChart.js                # interactive SVG line chart
└── settings/
    ├── SettingsPage.js
    └── BusinessProfileDialog.js       # quick business-profile pop-up

lib/
├── business.js                        # INDUSTRIES, CUSTOMER_TYPES, cleanBusiness, businessContext, businessKeywords
├── settings.js                        # useSettings, useBusiness, alert types, timezones
├── useStored.js                       # localStorage-backed state shared across components and tabs
├── useHydrated.js · scrollLock.js
├── features.js                        # FIT_ENABLED switch
├── advice.js · trends.js · campaignFocus.js · presetAudiences.js
├── useTrendFilters.js · useAudiences.js
├── contentKinds.js                    # the 8 creator screens and their field options
├── campaignBrief.js                   # campaign brief fields, cleanBrief, briefProblem
├── contentTrend.js                    # page-to-page handoff (sessionStorage)
├── savedContent.js                    # My Content (localStorage)
├── calendar.js · calendarDates.js · calendarOptions.js
├── periods.js · usePeriod.js          # date ranges for Overview and Reports
├── sample/
│   ├── series.js                      # deterministic daily sample figures
│   ├── overview.js · reports.js       # card / report figures for a date range
├── assistant/
│   ├── shared.js                      # SENSE_ROUTES, starter prompts, openSense()
│   └── sampleData.js                  # sample figures summarised for Sense AI
├── apify/
│   ├── config.js · client.js · normalize.js · buildTrends.js · getTrends.js
└── gemini/
    ├── client.js                      # generateJson() via REST
    ├── audience.js                    # suggestions, search hashtags, audience fit
    ├── campaign.js                    # campaign direction (Audience page)
    ├── content.js                     # the 8 creators
    ├── campaignPlan.js                # Campaign builder
    ├── plan.js                        # two-week posting plan
    └── assistant.js                   # Sense AI answers

public/sidebar/*.svg                   # logo and nav icons
```

---

## 6. Server actions

Actions are called only from button handlers and **never throw**: failures come back as an `error` / `errors` field that the UI displays. Every action that calls Gemini first checks `isGeminiConfigured()`.

| Action | File | Triggered by | Returns |
| ------ | ---- | ------------ | ------- |
| `suggestAudiences(query, business)` | `audience-trends/actions.js` | **✦ Suggest with AI** | `{ audiences: string[], error? }` |
| `planTrendSearch(audiences, business)` | ″ | **Find trends for…** | `{ hashtags: [{ tag, audience }], error? }` |
| `runTrendSearch(audiences, hashtags, business)` | ″ | **Run trend search** | `{ trends, updatedAt, audiences, hashtags, errors }` |
| `generateCampaignDirection(trend, audiences, focus, attempt, business)` | ″ | **✦ Generate / Regenerate** | `{ angle: { headline, summary, do, avoid, why }, error? }` |
| `generateContent(kind, fields, trend, business)` | `content-creation/actions.js` | Generate on any creator | `{ result, error? }` (shape depends on `kind`) |
| `generateCampaign(brief, trend, business)` | ″ | **Generate campaign** | `{ plan, error? }` |
| `createPostingPlan({ goal, channels, perWeek, startWeekday, business })` | `ai-management/actions.js` | **Create my plan** | `{ plan: { recommendation, posts }, error? }` |
| `askSense(messages, client, business)` | `app/actions/assistant.js` | **Ask** in Sense AI | `{ reply: { answer, followUps, action }, error? }` |

**Input limits enforced on the server:**
- **Audiences:** whitespace collapsed, at most 60 characters, at most 5 per call.
- **Hashtags:** lowercase, only `[a-z0-9_]`, 2–40 characters, at most `MAX_HASHTAGS_PER_SEARCH` (6).
- **Campaign focus:** `type` must be one of `FOCUS_TYPES` (otherwise "Product"), `name` ≤ 100 characters, `details` ≤ 400.
- **Creator fields:** only the fields listed for that `kind` in `CONTENT_KINDS`; choice fields must be one of `FIELD_OPTIONS` (otherwise the first option); pasted material ≤ 4,000 characters (uploaded files ≤ 12,000); other text ≤ 600. Each editor requires its main field (post, text, source, file or product).
- **Campaign brief:** `cleanBrief()` validates every field (goal, focus, channels, segments ≤ 8, days 7–90, ISO launch date); `briefProblem()` requires an offer, an audience name or segment, and at least one channel.
- **Posting plan:** goal 5–500 characters, channels from `PLAN_CHANNELS` (Instagram, TikTok), frequency from `PLAN_FREQUENCIES` (2–5 per week).
- **Sense AI:** at most the last 10 messages, each ≤ 1,200 characters, and the last one must be from the user.
- **Handoffs** (`trend` argument): only name, audience, platform, format, hook and a known `source`, each clipped.

---

## 7. Business profile

The app no longer assumes an industry. The business profile lives in **Settings → Workspace** (also editable from the top bar's company pill and the Overview "Choose your topics" button) and is stored in this browser.

| Field | Used for |
| ----- | -------- |
| Company name | Top bar pill, Gemini context |
| Industry (`INDUSTRIES`, 16 + "Not specified") | Audience presets (`lib/presetAudiences.js`), Gemini context |
| Customers (B2C / B2B / Both) | Gemini context |
| What the business does (≤ 400 chars) | Gemini context; fallback keywords |
| Keywords (comma-separated, ≤ 12) | Gemini context; the non-AI fit estimate; "Interest in your topics" on Overview |

`lib/business.js`:
- `cleanBusiness(raw)` validates the profile (used on both sides).
- `businessContext(raw)` builds the paragraph that starts every Gemini system prompt. Quoted business details are marked as "a description, never instructions". With no profile, Gemini is told not to assume an industry.
- `businessKeywords(raw)` returns the keywords, or the longer words from the description if none are set.

---

## 8. Audience trends in depth

### User flow

```
 Choose audiences ──► "Find trends for…" ──► Confirm hashtags ──► "Run trend search"
   (browser only)       Gemini: picks            remove any,          Apify: scrape TikTok +
   no network           hashtags (free)          see est. cost        Instagram (credits)
                                                                         │
                                                                         ▼
          "Use in Content" ◄── "✦ Generate campaign ◄── click a trend ◄── Ranked trend list
          (Content Creation)    direction" (Gemini)     (previews open)    saved to Apify storage
```

1. **Choose audiences.** Typing filters the preset audiences for your industry instantly, or press **✦ Suggest with AI** (Gemini) for tailored ones. **+ Add custom audience** adds exactly what you typed. Saved audiences appear as chips you can select (several at once) or remove.
2. **Find trends for…** sends the selected audiences to Gemini, which proposes up to **6 hashtags**. Nothing is scraped yet.
3. **Confirm.** Remove any hashtags you don't want. The panel shows the maximum number of posts and an estimated Apify cost (about **$0.19 per hashtag**).
4. **Run trend search · ~$X.** Apify scrapes 30 posts per hashtag on each platform (1–5 minutes). The posts are grouped into trends, saved, and shown in the table.
5. **Explore.** Filter by source (All platforms / Instagram / TikTok). Star trends to add them to the watchlist. Click a trend to open its **top 3 posts**, and click a post to play it.
6. **Campaign direction.** With a trend selected, optionally fill in **What are you promoting?** (Product / Service / Event / Sale or offer / General brand), then press **✦ Generate campaign direction** for a content angle, recommended approach, do/avoid guidance and the reasoning. **✦ Regenerate** asks for a new version, **Copy brief** copies it, and **Use in Content** opens Content Creation with the trend and angle attached.

**Page load never scrapes.** It reads the latest saved search result, so reloading is free.

### Sections on the page

- **Page header and live status banner:** "Searching TikTok & Instagram…", "Showing sample data · choose an audience to run a search", or "Live · updated N min ago", with the searched audiences and any errors (`role="alert"`).
- **Choose an audience** (`AudienceSelector.js`, `TrendSearchPanel.js`): ARIA combobox (↑/↓, Enter, Esc), AI suggestions marked "✦ Sense AI", saved chips with a loading placeholder, and the two-step search panel. If the selected audiences change after step 1, the panel resets.
- **Trend radar** (`TrendRadar.js`): HTML scatter of the filtered trends, x = momentum. While fit is off, y = weekly growth (−50% to +150%, clamped) with quadrants **Act now**, **Emerging**, **Peaking**, **Skip**; with fit on, y = fit with **Act now**, **Watch & prepare**, **Popular, poor fit**, **Skip**. Clicking a dot selects the trend everywhere.
- **Watchlist** (`Watchlist.js`): starred trends with momentum and advice; ones hidden by the source filter are marked and can't be selected.
- **How to read this** (`HowToRead.js`): explains momentum, weekly growth (or fit) and the advice thresholds; switches with `FIT_ENABLED`.
- **Trend table** (`TrendTable.js`, `TrendRow.js`, `TrendPosts.js`): trend name with `Platform · Format`, sparkline (hidden below `md`), momentum + weekly change, fit (only when enabled), advice, ★. Clicking a row opens its top 3 posts; **Play preview** swaps in the official player and **Open ↗** links out. Sized to fit a phone, with a sideways-scroll fallback.
- **Campaign direction** (`CampaignDirection.js`, `CampaignFocusForm.js`, `ContentAngleCard.js`): header with advice badge and **{trend} × {audiences}**, the focus form (kept across trends and saved in this browser), the dark **AI content angle** card, **Recommended approach**, **Do** / **Avoid**, **Why this advice**. Results are remembered per trend × audiences × focus for the session.

### Data model

**Post** (`lib/apify/normalize.js`):

```js
{
  id: "tt-7656741510913756433",     // "tt-" / "ig-" prefix
  platform: "TikTok",               // "TikTok" | "Instagram"
  text: "caption…",
  hashtags: ["sustainablehotel", …],// lowercase, no "#"
  createdAt: "2026-11-16T07:52:25.000Z",
  likes, comments, shares, views,   // numbers ≥ 0 (Instagram's hidden likes, -1, become 0)
  format: "Short-form video",       // TikTok: Short-form video | Slideshow
                                    // Instagram: Reel | Carousel | Image post
  url: "https://www.tiktok.com/@…/video/…",
  embedUrl: "https://www.tiktok.com/embed/v2/<id>",  // or instagram.com/p/<shortCode>/embed
  queryTag: "sustainablehotel",     // the hashtag this post was scraped for
}
```

**Trend** (`lib/apify/buildTrends.js`):

```js
{
  id: "tiktok-sustainablehotel",    // `${platform}-${hashtag}`
  name: "#sustainablehotel",
  platform: "TikTok",
  format: "Short-form video",       // most common format among its posts
  depth: "Broad",                   // "Broad" | "Niche" (computed, not shown in the UI at the moment)
  postCount: 30,
  momentum: 57,                     // 0–100
  change: 40,                       // % change in post count, last 7 days vs the 7 before
  fit: 100,                         // keyword fallback (hidden while FIT_ENABLED = false)
  history: [1, 0, 3, 2, 4, 5, 6],   // posts per day, last 7 days (sparkline)
  topPosts: [{ id, platform, format, url, embedUrl, text, likes, views }], // up to 3
  angle: null,                      // sample trends may carry a hand-written angle
  audienceFit: { "Hotel general managers": { fit, reason } }, // only when fit is enabled
}
```

The client adds `advice` (from `getAdvice`). When fit is enabled it also adds `fitReasons` and `baseFit`.

**Saved search result** (Apify key-value store `trendtracker`, record `latest`):

```js
{ trends: Trend[], updatedAt: 1763317166000, audiences: [...], hashtags: [...], errors: [] }
```

**Sample trends** (`lib/trends.js`): seven hand-written trends shown, and labelled as sample data, until the first search has been saved.

### Scoring and advice

**Momentum** (`buildTrends.js`):

```
momentum = 100 × ( 0.5 × engagementRank          // trend's avg engagement/post, percentile among all trends
                 + 0.3 × clamp(change / 100, 0–1) // week-over-week post growth, capped at +100 %
                 + 0.2 × recentShare )            // share of its posts from the last 7 days
engagement(post) = likes + 2 × comments + 3 × shares
```

**Depth:** `"Broad"` if the trend's total reach (engagement + views) is at or above the median of all trends, otherwise `"Niche"`.

**Fit (currently off).** `FIT_ENABLED = false` in `lib/features.js`. While it's off the Fit column is hidden, `runTrendSearch` skips the Gemini fit step, and advice uses momentum only. When it's on:
- **Fallback:** the share of a trend's posts that mention one of the business keywords (`businessKeywords()`), × 1.5, capped at 100.
- **Gemini:** `getAudienceFit(audience, trends, context)` returns a 0–100 score and a one-line reason per trend, per audience. The client averages them over the selected audiences.

**Advice** (`lib/advice.js`):

| Label | Fit off (current) | Fit on |
| ----- | ----------------- | ------ |
| **Act now** | momentum ≥ 75 | momentum ≥ 75 **and** fit ≥ 70 |
| **Use with care** | momentum ≥ 60 | momentum ≥ 60 **and** fit ≥ 60 |
| **Watch** | momentum ≥ 40 | everything else with fit ≥ 40 |
| **Skip** | momentum < 40 | fit < 40 |

The table is sorted by advice rank, then by momentum (highest first).

---

## 9. Apify integration

**Actors** (`lib/apify/config.js`):

| Platform | Actor | Input |
| -------- | ----- | ----- |
| TikTok | `clockworks/tiktok-scraper` | `{ hashtags, resultsPerPage: 30, shouldDownload*: false }` |
| Instagram | `apify/instagram-hashtag-scraper` | `{ hashtags, resultsType: "posts", resultsLimit: 30 }` |

**REST calls** (`lib/apify/client.js`, `Authorization: Bearer $APIFY_TOKEN`):

| Function | Endpoint | Cost |
| -------- | -------- | ---- |
| `runActor(id, input)` | `POST /v2/acts/{id}/run-sync-get-dataset-items?timeout=300&clean=true` | **Credits** |
| `getLastRunItems(id)` | `GET /v2/acts/{id}/runs/last?status=SUCCEEDED`, then `GET /v2/datasets/{id}/items` | ~free |
| `getRecord(store, key)` | `POST /v2/key-value-stores?name=…` (get-or-create), then `GET …/records/{key}` | ~free |
| `putRecord(store, key, value)` | `PUT /v2/key-value-stores/{id}/records/{key}` | ~free |

**Pipeline** (`lib/apify/getTrends.js`):
- `scrapeTrends(hashtags, keywords)` runs both actors in parallel (`Promise.allSettled`), normalizes the posts and builds the trends. If one platform fails, its error is reported and the other platform's trends are still returned.
- `getLatestTrends()` reads the saved `latest` record. If there isn't one, it rebuilds trends from each actor's last successful run (for example runs started from the Apify console). Sense AI also reads it.
- A hashtag needs at least `MIN_POSTS_PER_TREND` (3) matching posts on a platform to become a trend.

**Cost estimate.** `EST_COST_PER_POST` (TikTok $0.0037, Instagram $0.0026) was measured on the first real run in Nov 2026: 156 posts for about $0.51, so about $0.19 per hashtag at 30 posts per platform. It's only an estimate; check actual usage in the Apify console.

**Post previews** use the platforms' official embed players, not downloaded video, so they cost no credits. A player only loads when the user clicks **Play preview**, and each iframe is sandboxed (`allow-scripts allow-same-origin allow-popups allow-presentation`).

---

## 10. Gemini integration

**Client** (`lib/gemini/client.js`): `generateJson({ system, prompt, schema, temperature })` calls `POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent` with the key in the `x-goog-api-key` header and structured output (`responseMimeType: "application/json"` + `responseSchema`). A 429 becomes "Gemini rate limit reached. Try again in a minute." No SDK dependency.

**Model:** `gemini-flash-lite-latest` by default. Override it with `GEMINI_MODEL`.

| Function | File | Output | Cache | Temp |
| -------- | ---- | ------ | ----- | ---- |
| `getAudienceSuggestions(query, context)` | `audience.js` | up to 6 audience names | days | 0.6 |
| `getSearchHashtags(audiences, max, context)` | `audience.js` | `[{ tag, audience }]` | days | 0.4 |
| `getAudienceFit(audience, trends, context)` | `audience.js` | `{ [trendId]: { fit, reason } }` (only when fit is enabled) | hours | 0.3 |
| `getCampaignDirection(trend, audiences, focus, attempt, context)` | `campaign.js` | `{ headline, summary, do, avoid, why }` | days | 0.7 |
| `generateContentFor(kind, fields, trend, context)` | `content.js` | per-kind result (below) | none | 0.8 |
| `generateCampaignPlan(brief, trend, context)` | `campaignPlan.js` | full campaign plan (below) | none | 0.7 |
| `generatePostingPlan({ goal, channels, perWeek, startWeekday, context })` | `plan.js` | `{ recommendation, posts }` | none | 0.8 |
| `askSenseAI({ messages, workspace, context })` | `assistant.js` | `{ answer, followUps, action }` | none | 0.5 |

**Creator outputs** (`lib/gemini/content.js`, screens defined in `lib/contentKinds.js`):

| Kind | Form fields | Result |
| ---- | ----------- | ------ |
| `social` | goal, tone, idea | hook, caption, visual guidelines, hashtags |
| `video` | platform, goal, format, duration, idea | hook, script, concept, scenes (with timings) |
| `blog` | tone, topic | 3 titles, outline, key points, SEO keywords |
| `ad` | product, ad goal, ad format, key message | 3 headlines, 3 copy options, 3 CTAs, creative guidelines |
| `edit` | post, what to change, instructions | edited hook + caption, 3 alternatives, visual suggestions, hashtags |
| `improve` | content type, text, what to improve, instructions | improved text, 3 alternatives, key improvements |
| `repurpose` | source (pasted or picked from My Content), platforms, instructions | one version per platform with hashtags and adjustments |
| `upload` | text file or pasted text, focus (Edit / Rewrite / Copy / Insights), instructions | result, summary, suggested actions, takeaways |

**Campaign plan** (`campaignPlan.js`): name, core message, summary, positioning, audience tension, creative direction, channel plan (only the chosen channels), 3–4 timeline phases, 4 starter content ideas, and 3–4 measurement targets.

**Posting plan** (`plan.js`): exactly `perWeek × 2` posts over two weeks, each with title, channel, format (Image / Carousel / Reel / Video / Story), day offset, time and caption, plus a one-sentence recommendation. Gemini is told which weekday day 0 is, so it can reason about days without knowing the calendar.

**Prompt safety and output checks:**
- Every system prompt starts with `businessContext()` and tells Gemini not to invent statistics, prices, awards or customer names.
- Text the marketer types or pastes is wrapped in tags (`<goal>`, `<brief>`, `<content>`, `<workspace>`, `<conversation>`) or quoted, and Gemini is told to treat it as data, never instructions.
- Every result is filtered and clipped again on the server: hashtags re-sanitized, enums re-checked, numbers clamped, lists capped, duplicate plan posts dropped.
- **Regenerate** on the Audience page passes `attempt`, which is part of the cache key only, so it gets a new answer while repeat views come from the cache.

---

## 11. Sense AI assistant

A drawer (`components/shell/SenseAssistant.js`) mounted once in the app shell. It opens from the sidebar **?** button, from the top bar search (asking the typed text straight away), or from anywhere via `openSense(question)` in `lib/assistant/shared.js`.

- **Starter prompts:** "What is gaining momentum right now?", "What content should we create next?", "How are competitors performing?". Each answer comes with 2–3 follow-up questions.
- **What it knows** (`askSense` builds a plain-text workspace summary):
  - today's date and the page the marketer is on,
  - selected audiences, the next 6 calendar posts, the 10 newest My Content items and the current campaign draft (sent from the browser),
  - the top 10 trends by momentum from the latest saved search (read on the server),
  - the Overview, Reports and Competitors sample figures for 7 and 30 days, labelled as sample data (`lib/assistant/sampleData.js`).
- **Rules:** answer only from that workspace, say plainly when it doesn't cover the question, always flag sample figures, never invent numbers or names.
- **Actions:** an answer can include one button: **open a page** (any route in `SENSE_ROUTES`) or **create** (opens a creator or the Campaign builder pre-filled with the suggested idea, via the handoff in [§12](#12-handing-ideas-between-pages)).
- **Rendering:** paragraphs, `- ` bullets and `**bold**` only; React escapes everything else.

---

## 12. Handing ideas between pages

`lib/contentTrend.js` passes a starting point to a Content Creation screen through `sessionStorage` (this tab only):

| Source | From | Label on the creator |
| ------ | ---- | -------------------- |
| `trend` | Audience → **Use in Content** | From Audience trends |
| `calendar` | AI Management / My Content → write or rewrite a post's caption | From your content calendar |
| `campaign` | Campaign builder → a starter content idea | From your campaign |
| `competitor` | Competitors → "Your next move" | From a competitor insight |
| `assistant` | Sense AI → a "create" action | From Sense AI |

- Each handoff is addressed to one path. `ContentTrendWatcher` drops it as soon as the user goes anywhere else, so opening Content Creation from the sidebar later starts clean. `forwardContentTrend()` passes it from the landing page to the chosen creator.
- The creator shows what it's building on, with a × to stop using it, and a **Back** link to where the handoff came from (`returnTo`, e.g. "Back to calendar").
- Gemini gets a sentence describing the starting point that matches its source (see `startingPoint()` in `lib/gemini/content.js`).

---

## 13. Sample data, date ranges and charts

Overview, Reports and Competitors use **sample data** until real ad, analytics and competitor sources are connected.

- **`lib/sample/series.js`** generates figures for any calendar day from a hash of the date (FNV-1a + mulberry32), so numbers are the same on every visit and device and any date range can be added up. It includes Google/Meta spend, revenue, impressions, clicks and conversions, topic posts, new followers, engagement, three competitors (GuestSupply, Out of Eden, Hotel Buyer) and four channels (Instagram, Facebook, Web, Email), with weekday and seasonal shapes. **To connect real data, replace `dayFigures()` with a lookup; the totals logic stays.**
- **`lib/sample/overview.js`** and **`lib/sample/reports.js`** turn a date range into card and report figures (comparison with the previous period of equal length, best posting weekdays, ROAS/CPA, an insight sentence).
- **Date ranges** (`lib/periods.js`, `PeriodPicker.js`): 7 / 30 / 90 days or **Custom** (From–To, clamped to the past 365 days). The comparison period is the same length, immediately before. The choice is shared by Overview and Reports and remembered in this browser (`usePeriod()`).
- **Chart points** (`buckets()`): daily up to a month, then about weekly up to ~4 months, then about monthly, so a chart never has more than ~13 points.
- **Revenue chart** (`RevenueChart.js`): hand-written SVG (monotone cubic curves, no chart library). Hover, tap or the arrow keys show a label with that point's exact figures, placed so it stays on screen on phones.
- **InfoTip** (ⓘ) next to metrics explains them in plain language.
- **Competitors** uses three placeholder campaigns in `CompetitorsDashboard.js` (`CAMPAIGNS`); swap them for real values when tracking is connected.

---

## 14. Client state and persistence

There are no accounts or database yet. All user data lives in this browser.

`useStored(key, fallback)` (`lib/useStored.js`) is the main store: JSON in `localStorage`, read through `useSyncExternalStore`, so every component and tab that uses the same key updates live. The server renders `fallback`; pages use `useHydrated()` to show skeletons instead of empty defaults until the browser has loaded.

| Data | Where | Shared? |
| ---- | ----- | ------- |
| Latest trend search result | Apify key-value store `trendtracker` / `latest` | Everyone using this token |
| Profile, business profile, alert preferences | `localStorage["trendtracker:settings"]` | This browser |
| Saved + selected audiences | `localStorage["trendtracker:audiences"]` | This browser |
| Watchlist | `localStorage["trendtracker:watchlist"]` | This browser |
| Campaign focus form (Audience) | `localStorage["trendtracker:campaign-focus"]` | This browser |
| Content calendar posts | `localStorage["trendtracker:calendar"]` | This browser |
| Last plan's recommendation | `localStorage["trendtracker:plan-note"]` | This browser |
| My Content (≤ 200 items) | `localStorage["trendtracker:saved-content"]` | This browser |
| Campaign brief + latest plan | `localStorage["trendtracker:campaign"]` | This browser |
| Overview/Reports date range | `localStorage["trendtracker:period"]` | This browser |
| Alerts already read | `localStorage["trendtracker:alerts-read"]` | This browser |
| Page-to-page handoff | `sessionStorage["trendtracker:content-trend"]` | This tab |
| Generated campaign directions | Component state (+ server cache for days) | This session |

Every storage read and write is wrapped in `try/catch`, so private windows and blocked storage don't crash the page.

**Calendar posts** (`lib/calendar.js`): `{ id, date: "YYYY-MM-DD", time, channels, format, title, caption, createdAt }`. A post can go to several channels (older posts and AI plans store a single `channel`; `channelsOf()` handles both). Times are every half hour from 6:00 AM to 10:00 PM (`lib/calendarOptions.js`). **Nothing publishes automatically.**

**My Content items** (`lib/savedContent.js`): `{ id, type, kind, title, text, trend, createdAt }`, newest first. My Content also lists calendar posts (read straight from the calendar, so the two never disagree), and they can be edited in the same `PostEditor` pop-up the calendar uses.

**Audience page state** (`useTrendFilters`): `live` result, `source` filter, `selectedTrendId`, `watchlist`, `searchPlan`, `isPlanning` / `isRunning`, plus `useAudiences()` and `useBusiness()`. Derived: `filteredTrends`, `selectedTrend` (defaults to the top trend), `watchedTrends`, `matchCount`, `isSample`.

---

## 15. Design tokens and shared UI

The look follows the **Marketing Intelligence Hub** Figma Make app and the **SIXTH SENSE** design file. Tokens are in `app/globals.css` (Tailwind v4 `@theme`):

```css
--color-paper:      #f6f8ed;  /* cards, text on dark */
--color-sense-navy: #001f3e;  /* body text, AI angle card, assistant overlay */
--color-sense-blue: #03525e;  /* headings, primary buttons */
--color-sense-lime: #ddfe56;  /* accents, live badge, positive change */
--color-coral-400:  #ff7f7f;  /* eyebrows, errors, negative change, Avoid */
--color-amber-300:  #f5c66b;  /* Use with care, saved star */
--color-forest-600: #527d51;
--color-ink-500:    #5f706e;  /* muted text */
--color-surface:    rgb(246 248 237 / 0.95);
--radius-card:      14px;
--font-sans:        var(--font-montserrat);
```

The older Audience-page names (`teal-900`, `navy-900`, `lime-400`) are kept and mapped onto the same palette, so every screen shares one set of colours.

- **Background:** radial lime glows over a fixed `#527d51 → #03525e → #b9db59` gradient.
- **Cards:** `Panel` (in `ui/Dashboard.js`) and `Card` share the paper look with the Make app's stacked drop shadow.
- **Shared pieces:** `PageTitle` (eyebrow, title, description), change pills (lime up, coral down), `Toggle`/`SegmentedControl` pills, `PeriodPicker`, `InfoTip`, `Icon` (24×24 outline set), `Skeleton`.

---

## 16. Accessibility

- **Navigation:** `<nav aria-label="Main">` with `aria-current` on the active page; the phone drawer and Sense AI drawer close on Escape, lock page scroll (`lib/scrollLock.js`, counted so two drawers never leave the page stuck) and have labelled close buttons.
- **Audience search:** an ARIA combobox (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`) with a `role="listbox"` of options.
- **Toggles:** segmented controls and choice chips use `role="radiogroup"` / `role="radio"` + `aria-checked` or `role="group"`; audience chips and watchlist stars use `aria-pressed`, with labelled remove buttons.
- **Trend rows:** the name is a real `<button>` with `aria-expanded`, and the row has `aria-selected`. Radar dots have descriptive `aria-label`s; the table is the accessible equivalent of the chart.
- **Charts:** the revenue chart can be inspected with the arrow keys, not just the mouse.
- **Live regions:** status changes use `aria-live="polite"`, errors use `role="alert"`, and loading areas use `role="status"` / `aria-busy` with labels such as "Loading your calendar".
- **Alerts bell:** its label includes the unread count; the popover is a labelled dialog.
- **Embeds:** each iframe has a descriptive `title`, and players load only on request.

---

## 17. Configuration reference

| Setting | File | Default | Effect |
| ------- | ---- | ------- | ------ |
| `FIT_ENABLED` | `lib/features.js` | `false` | Shows/hides fit everywhere and turns Gemini fit scoring on or off |
| `MAX_HASHTAGS_PER_SEARCH` | `lib/apify/config.js` | `6` | Hard cap on hashtags per search (server-enforced) |
| `RESULTS_PER_HASHTAG` | `lib/apify/config.js` | `30` | Posts per hashtag per platform (**main cost control**) |
| `MIN_POSTS_PER_TREND` | `lib/apify/config.js` | `3` | Minimum posts for a hashtag to become a trend |
| `EST_COST_PER_POST` | `lib/apify/config.js` | TikTok `0.0037`, Instagram `0.0026` | Cost estimate shown before running |
| `ACTORS` | `lib/apify/config.js` | TikTok + Instagram | Which scrapers run and their input |
| `RESULT_STORE` / `RESULT_KEY` | `lib/apify/config.js` | `trendtracker` / `latest` | Where results are saved |
| `INDUSTRIES`, `CUSTOMER_TYPES` | `lib/business.js` | 16 industries; B2C / B2B / Both | Business profile choices |
| Preset audiences | `lib/presetAudiences.js` | 12 general + per-industry | Instant offline suggestions |
| `FOCUS_TYPES` | `lib/campaignFocus.js` | Product, Service, Event, Sale or offer, General brand | Audience-page campaign focus |
| `CONTENT_KINDS`, `FIELD_OPTIONS` | `lib/contentKinds.js` | 8 screens | Creator screens, fields and choices |
| `CAMPAIGN_GOALS`, `CAMPAIGN_CHANNELS`, … | `lib/campaignBrief.js` | — | Campaign builder choices |
| `PLAN_CHANNELS`, `PLAN_FREQUENCIES`, `PLAN_WEEKS` | `lib/gemini/plan.js` | Instagram + TikTok; 2–5/week; 2 weeks | AI posting plan |
| `POST_FORMATS`, `POST_TIMES` | `lib/calendarOptions.js` | 5 formats; 6 AM–10 PM every 30 min | Calendar post editor |
| `PRESETS`, `MAX_CUSTOM_DAYS` | `lib/periods.js` | 7/30/90 days; 365 | Date ranges |
| `SENSE_ROUTES`, `STARTER_PROMPTS` | `lib/assistant/shared.js` | — | Pages Sense AI can open; starter questions |
| `ALERT_TYPES`, `TIMEZONES` | `lib/settings.js` | 4 alert types; PT/MT/CT/ET | Settings → Notifications / Profile |
| `NAV`, `UTILITY` | `components/shell/nav.js` | 6 pages + Settings | Sidebar and phone menu |
| `GEMINI_MODEL` | `.env.local` | `gemini-flash-lite-latest` | Gemini model |

---

## 18. Known limitations and next steps

**Limitations**
- **No accounts or database.** Settings, audiences, calendar, My Content and campaign drafts live in `localStorage`, so they don't follow you to another browser or device, and clearing site data loses them.
- **Overview, Reports and Competitors are sample data.** They're realistic and consistent, and Sense AI labels them as samples, but they aren't connected to any ad, analytics or competitor source.
- **Alerts are illustrative.** The bell lists alert types from Settings, but nothing monitors competitors or trends in the background, and the timezone setting isn't used yet.
- **Nothing publishes.** Calendar posts are plans only; there's no Instagram/TikTok posting integration.
- **Fit is turned off.** The keyword fallback isn't discriminating, and Gemini fit judges only a trend's name and 3 captions. Revisit the method before setting `FIT_ENABLED = true`.
- **The radar's axes overlap.** While fit is off, the y-axis (weekly growth) is also 30% of momentum, so dots tend to run along a diagonal.
- **Momentum is relative and noisy.** It ranks trends within one search, and with only 30 posts per hashtag, `change` and `history` are rough.
- **One shared saved trend result.** Every search overwrites `trendtracker/latest`; there's no per-user history.
- **Searches block the action.** `run-sync` waits up to 300 s; longer runs return a timeout error while the Apify run keeps going. On hosting with short function limits (e.g. Vercel Hobby), start runs asynchronously and poll.
- **Embeds can disappear.** Players show "unavailable" for deleted or private posts.
- **Sense AI has no memory between sessions** and only sees the summary described in [§11](#11-sense-ai-assistant).
- **Gemini free tier limits.** Content, campaign, plan and assistant calls aren't cached, so heavy use can hit the rate limit.
- **No automated tests.** The scoring, normalization, `periods.js`, `sample/series.js`, `cleanBrief` and `cleanBusiness` functions are pure and the easiest place to start.

**Next steps (suggested order)**
1. Accounts and a database for settings, audiences, calendar, My Content, campaigns and search history.
2. Connect real data sources and replace `dayFigures()` and the Competitors `CAMPAIGNS`.
3. Background jobs for alerts (trend spikes, competitor campaigns, calendar reminders).
4. Fit redesign. The radar, How to read and advice switch over automatically when `FIT_ENABLED` is set to `true`.
5. Async Apify runs with polling.
6. Remove unused files (`ui/Button.js`, `ui/SearchInput.js`, `ui/Eyebrow.js`, the starter `public/*.svg`) or start using them.
