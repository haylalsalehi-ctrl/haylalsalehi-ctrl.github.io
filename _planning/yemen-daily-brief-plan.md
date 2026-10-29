# Yemen Daily Brief: plan and prompts

Site: https://haylalsalehi.com (repo `haylalsalehi-ctrl/haylalsalehi-ctrl.github.io`, branch `main`)
Decisions made: review before publishing (pull request you merge), daily at about 1:45 pm Eastern.

---

## 1. What it is

A slim, auto-advancing "slide deck" band at the top of both pages (English `/` and Arabic `/ar/`), directly under the top bar and above the hero. Each day it shows 3 to 6 slides summarizing the last 24 hours in Yemen, each with sources. As each slide comes up, the site's existing background map of the region marks where it happened (for example a pulsing ring on Hodeidah or the Bab al-Mandab strait). A daily scheduled task drafts the next brief and opens a pull request. You merge it from your phone, GitHub Pages redeploys, and the band updates.

```
┌───────────────────────────────────────────────────────────────────┐
│ Hayl Al-Salehi — Yemen & MENA research        About ... العربية ◐ │  ← existing top bar
├───────────────────────────────────────────────────────────────────┤
│ YEMEN DAILY BRIEF · 30 Oct 2026                  ‹  ❚❚  ›  2 / 5  │
│ RED SEA & MARITIME                                                │
│ Headline of the slide in serif                                    │
│ Two-sentence summary of what happened and why it matters.         │
│ ◎ Hodeidah · Sources: ReliefWeb · Reuters        ▬▬▬▬▬▬▭▭▭ (timer) │
├───────────────────────────────────────────────────────────────────┤
│ Hero (unchanged)                                                  │
│                                   background map:                 │
│                                        Red Sea  ◎ ← pulsing ring  │
│                                              ● Sana'a  (existing) │
```

---

## 2. Architecture map

```
 ┌──────────────────────────── daily, 1:38 pm ET ────────────────────────────┐
 │ Scheduled task (fresh cloud session, repo attached)                       │
 │  1. Gather: WebSearch + fetch allowed news/humanitarian sources           │
 │  2. Write:  brief/archive/YYYY-MM-DD.json  (English + Arabic)             │
 │             brief/latest.json  (copy of today)                            │
 │             brief/index.json   (list of dates)                            │
 │  3. Validate against brief/schema.json (python, no dependencies)          │
 │  4. Push branch  brief/YYYY-MM-DD  →  open pull request with summary      │
 └───────────────────────────────┬───────────────────────────────────────────┘
                                 │ push notification
                                 ▼
                    You: open PR on phone → read → Merge
                                 │
                                 ▼
                 GitHub Pages redeploys main (about 1 minute)
                                 │
          ┌──────────────────────┴───────────────────────┐
          ▼                                              ▼
  haylalsalehi.com  (site.js fetches              haylalsalehi.com/ar/
  /brief/latest.json, renders English)            (same file, renders Arabic, RTL)
          │                                              │
          └──────────────► on each slide change ◄────────┘
                    carousel → menaMap.highlight(location)
                    background map draws a ring + label at
                    that place; cleared when slide has none
```

Files in the repo after the build session:

| Path | Purpose | Who writes it |
|---|---|---|
| `brief/schema.json` | JSON Schema for one day's brief | Build session (once) |
| `brief/latest.json` | Brief currently shown | Daily task |
| `brief/archive/YYYY-MM-DD.json` | Permanent record of each day | Daily task |
| `brief/index.json` | `{"dates": [...]}` newest first | Daily task |
| `brief/README.md` | How the brief works, editorial rules | Build session (once) |
| `style.css`, `site.js` | Carousel styles and behavior (shared by both languages) | Build session (once) |
| `index.html`, `ar/index.html` | Empty carousel container under the top bar | Build session (once) |

Note: GitHub Pages runs Jekyll, which would publish `brief/README.md` as a page. The build session should add a `_config.yml` with `exclude: [brief/README.md, brief/schema.json]`, or add an empty `.nojekyll` file and keep the README out of public view another way. Verify before relying on it.

---

## 3. Data format (one day)

```json
{
  "date": "2026-10-30",
  "generated_at": "2026-10-30T17:38:00Z",
  "status": "reviewed",
  "slides": [
    {
      "id": "maritime-1",
      "category": "maritime",
      "en": {
        "category_label": "Red Sea & maritime",
        "title": "Short headline, under 90 characters",
        "summary": "Two or three sentences: what happened, where, and why it matters.",
        "attribution": "According to UKMTO and Reuters"
      },
      "ar": {
        "category_label": "البحر الأحمر والملاحة",
        "title": "عنوان قصير",
        "summary": "جملتان أو ثلاث بلغة عربية فصحى طبيعية، لا ترجمة حرفية.",
        "attribution": "بحسب هيئة عمليات التجارة البحرية البريطانية ورويترز"
      },
      "location": { "name_en": "Hodeidah", "name_ar": "الحديدة", "lat": 14.80, "lon": 42.95 },
      "sources": [
        { "name": "Reuters", "url": "https://...", "published": "2026-10-30" },
        { "name": "UKMTO", "url": "https://...", "published": "2026-10-30" }
      ]
    }
  ]
}
```

Categories (fixed list so styling and Arabic labels stay consistent):
`security` (frontlines and attacks), `politics` (government, PLC, Houthis, STC, diplomacy and talks), `humanitarian`, `economy` (currency, salaries, fuel, banking), `maritime` (Red Sea, Bab al-Mandab, Gulf of Aden), `regional` (Saudi, UAE, Iran, US, Israel actions affecting Yemen), `watch` (what to watch in the next days).

`location` drives the map highlight. Rules:
- Optional. Omit it when a story has no single place (for example a nationwide currency change or talks with no venue). The map then shows no ring for that slide.
- Precision: governorate or city for land events (use its approximate center), named sea area for maritime events (Red Sea off Hodeidah, Bab al-Mandab, Gulf of Aden). Never a street, village, or exact strike point.
- Allowed coordinates: inside the map's drawn area, latitude 12 to 41 and longitude -17 to 62. For every category except `regional`, it must also fall within the Yemen and nearby seas box: latitude 10 to 20, longitude 38 to 55 (this includes Socotra and the Bab al-Mandab).
- `name_en` and `name_ar` are short place names shown as the map label and as a chip on the slide (for example "Hodeidah" and "الحديدة").

---

## 4. Carousel behavior (spec for the build session)

- Placement: full-width band between the top bar and the hero on both pages, inside `<main>` before the hero, using existing design tokens (`--paper-2`, `--rule`, `--accent`, Amiri for titles, IBM Plex Sans Arabic for labels).
- Content: label "Yemen Daily Brief · {date}" (Arabic: "الموجز اليومي عن اليمن · {date}"), category label, title, summary, attribution, source links (open in new tab, `rel="noopener"`).
- Motion: auto-advance every 9 seconds with a thin progress bar. Pauses on hover, on keyboard focus, and when the tab is hidden. No autoplay when `prefers-reduced-motion: reduce`.
- Controls: previous, pause/play, next, and "2 / 5" counter. Arrow keys work when focused. In Arabic, arrows and swipe direction mirror.
- Mobile: swipe left and right; band height adapts to content; no horizontal page scroll at 360 px.
- Accessibility: `section` with `aria-roledescription="carousel"` and a label; each slide `role="group"` `aria-roledescription="slide"` `aria-label="2 of 5"`; live region set to `polite` only while paused or after manual navigation, `off` while auto-rotating; pause button is the first focusable control.
- Freshness: hide the whole band if `latest.json` is missing, invalid, or older than 72 hours. If 24 to 72 hours old, show "Last updated {date}" instead of the date label.
- Honesty line under the deck, small text: "Compiled from public reporting with AI assistance and reviewed by Hayl Al-Salehi. Not an official assessment." Arabic equivalent on `/ar/`. Link "Sources" per slide.
- Performance: one small JSON fetch, no new libraries. Must not delay the hero.
- Language: `/` renders the `en` block, `/ar/` renders the `ar` block. Dates formatted with `Intl.DateTimeFormat` (`en-CA`, `ar` with Western digits via `numberingSystem: "latn"` to match the rest of the Arabic page).
- Location chip: when a slide has `location`, show a small "◎ Hodeidah" chip (Arabic: "◎ الحديدة") before the sources line. This keeps the place readable as text, since the map itself is decorative.

### 4b. Map highlight

How the existing map works today (in `site.js`): a fixed, full-screen SVG (`#mena-map`, `aria-hidden`) behind the page, drawn with d3 and topojson from `world-atlas@2.0.2`. It uses a Mercator projection fitted to the box longitude -17 to 62, latitude 12 to 41, highlights Yemen and Lebanon, shows two gold pins (Sana'a and Beirut), and fully redraws on window resize.

What to add:
- Small API in `site.js`: `window.menaMap = { highlight(loc, label), clear() }`. The map code keeps the current highlight in a variable and re-applies it after every redraw (resize, theme change), so it never disappears or jumps.
- Drawing: a separate `<g class="brief-mark">` layer on top of countries and below the veil gradient, containing:
  - a ring in `var(--accent)` that pulses (scale 1 to 2.2, fading out, 2.4 s loop),
  - a solid center dot in `var(--accent)`,
  - a label in the page's language (Amiri, 15 px, `var(--ink-soft)`), placed to the side that keeps it on screen (left of the point on `/`, right of it on `/ar/` when near the edge).
  Existing Sana'a and Beirut pins stay as they are in gold, so the brief marker is visibly different.
- Transition: when the slide changes, fade the old marker out and the new one in (300 ms). No marker for slides without `location`.
- Reduced motion: no pulse and no fade; show a static ring.
- Scroll behavior: only show the marker while the brief band is on screen (IntersectionObserver on the band). Clear it when the reader scrolls past, so it does not distract during the rest of the page. Restore it when they scroll back up.
- Mobile (under 820 px): keep the ring, hide the text label (the chip on the slide already names the place).
- Robustness: if the map fails to load (CDN blocked) or `location` is invalid, the carousel works normally with no marker. Never throw.
- Visibility check: the Yemen area sits in the lower right of the map on desktop. Confirm in screenshots that the marker is visible and not hidden behind the hero portrait or the "Ask me about Yemen" button on both pages, in light and dark mode. If it is covered, nudge the projection's fitted area (for example extend the box slightly south or east) rather than moving page content.
- Accessibility: the map stays `aria-hidden`; all location information is in the slide text and chip.

---

## 5. Editorial rules (go into the daily prompt and brief/README.md)

1. Every slide needs at least one source link published within the last 36 hours. Casualty figures, attack claims, and claims about named people need two independent sources or an explicit attribution ("Houthi-run Saba reported...").
2. Never invent facts, numbers, quotes, or locations. If unsure, leave it out.
3. Neutral naming: "the Houthis (Ansar Allah)", "the internationally recognized government" or "the Presidential Leadership Council (PLC)", "the Southern Transitional Council (STC)". Name partisan outlets as partisan.
4. No graphic detail, no speculation about individuals, no unverified social media posts.
5. Quiet day: publish fewer slides (minimum 3). If fewer than 3 slides meet the sourcing bar, do not open a PR; post a note in the session instead.
6. English and Arabic must say the same thing. Arabic is written as natural Modern Standard Arabic, not word-for-word translation. Use official Arabic names of organizations.
7. Style: plain, concise, no em dashes, no hype words ("shocking", "unprecedented" unless quoted).
8. Do not duplicate yesterday's slides unless there is a new development; say what is new.

Suggested sources (add these hosts to the scheduled environment's allowed domains):
- Humanitarian: `reliefweb.int`, `api.reliefweb.int`, `unocha.org`, `wfp.org`, `ipcinfo.org`, `unicef.org`
- Analysis: `sanaacenter.org`, `crisisgroup.org`, `acleddata.com`, `yemenpolicy.org`
- Wires and outlets: `reuters.com`, `apnews.com`, `aljazeera.com`, `aljazeera.net`, `aawsat.com`, `almasdaronline.com`, `south24.net`
- Maritime: `ukmto.org`
- Official outlets (always attribute): `sabanew.net` (government Saba), `saba.ye` (Houthi-run Saba)

---

## 6. Rollout

| Phase | What | Who |
|---|---|---|
| 1 | Build carousel, map highlight, schema, README, sample brief; test both languages; merge | Build session (Prompt A) |
| 2 | Allow source domains in the environment's network settings | You |
| 3 | Create the daily scheduled task with Prompt B; fire it once manually; review the first PR | Build session or you |
| 4 | Run for a week; adjust categories, length, sources | You + any session |
| 5 (optional) | Crawlable `/brief/` archive pages so each day's brief can appear in search results | Later session |

---

## 7. Prompt A: build session (paste into a new session)

```
Repo: haylalsalehi-ctrl/haylalsalehi-ctrl.github.io (branch main, GitHub Pages, custom domain haylalsalehi.com). It is a static bilingual site: index.html (English), ar/index.html (Arabic, dir="rtl"), shared style.css and site.js. No build tools or frameworks; keep it that way.

Goal: add a "Yemen Daily Brief" carousel band at the top of both pages, fed by a JSON file that a daily scheduled task will update through pull requests.

Read yemen-daily-brief-plan.md sections 3, 4 (including 4b, the map highlight) and 5 (I will paste them below) and implement exactly that:

1. Create brief/schema.json (JSON Schema draft 2020-12) for the format in section 3. Categories are a fixed enum: security, politics, humanitarian, economy, maritime, regional, watch. 3 to 6 slides. Each slide needs en and ar blocks and at least one source with an https URL.
2. Create brief/README.md describing the files and the editorial rules from section 5. Make sure GitHub Pages does not publish README.md or schema.json as pages (use _config.yml exclude; verify).
3. Create a realistic SAMPLE brief at brief/latest.json, brief/archive/<today>.json and brief/index.json, clearly marked "status": "sample" with placeholder text that says it is a sample. The carousel must show a visible "Sample" badge when status is "sample". Give the sample slides varied locations (one land city such as Marib, one sea area such as Bab al-Mandab, one regional location outside Yemen, and one slide with no location) so the map highlight can be tested.
4. Add the carousel container to index.html and ar/index.html directly inside <main>, before the hero section. Add styles to style.css and behavior to site.js, following section 4 (autoplay, pause rules, reduced motion, keyboard, swipe, RTL mirroring, ARIA, freshness rules, honesty line, location chip). Reuse existing CSS variables and fonts; match the site's look in light and dark mode.
5. Add the map highlight from section 4b to the existing map code in site.js: the window.menaMap highlight/clear API, the marker layer that survives redraws, pulse and fade (static under reduced motion), only while the band is on screen, label hidden on mobile, and no errors if the map or a location is missing. Keep the existing Sana'a and Beirut pins unchanged.
6. Write a small dependency-free validator, tools/validate_brief.py (python3 standard library only), that checks a brief file against the schema rules (required fields, enums, slide count, https URLs, dates, en/ar both present, location coordinate bounds from section 3). Exclude tools/ from the published site.
7. Test with Playwright (preinstalled) via a local http.server at the repo root: desktop 1280 px and mobile 360 px, both languages, light and dark, reduced motion on and off. Confirm no console errors, no horizontal scroll, autoplay pauses on hover and focus, keyboard and swipe work, the band hides when latest.json is missing or older than 72 hours. For the map: confirm the marker moves to each slide's location, disappears for the slide without one, stays correct after resizing the window and toggling dark mode, clears when scrolling past the band, and is not hidden behind the portrait or the "Ask me about Yemen" button. The map data loads from cdn.jsdelivr.net; if the sandbox blocks it, tell me and test the marker logic against a stubbed map. Take screenshots and show me.
8. Commit on main with a clear message and push. Confirm the live site after Pages deploys.

Do not change any other content on the pages. Ask me before anything that changes the existing design beyond adding the band.

After it is live and I approve, create a scheduled task (fresh session on each run, in this environment, with this repo) named "Yemen Daily Brief" with cron "CRON_TZ=America/Toronto 38 13 * * *" and push notifications on, using the prompt I will give you (Prompt B). Then fire it once so I can review the first pull request.

[Paste sections 3, 4 (with 4b) and 5 of the plan here.]
```

---

## 8. Prompt B: the daily scheduled task (give this to the build session, or paste when creating the task)

```
You are preparing today's Yemen Daily Brief for haylalsalehi.com, a personal site of Hayl Al-Salehi, a Yemen and MENA researcher. The brief is published only after Hayl reviews and merges your pull request.

Repository: haylalsalehi-ctrl/haylalsalehi-ctrl.github.io (default branch main). Read brief/README.md and brief/schema.json first and follow them exactly.

Steps:
1. Determine today's date in Yemen time (Asia/Aden). Read brief/latest.json to see yesterday's slides so you do not repeat them without a new development.
2. Research the last 24 to 36 hours of Yemen news using web search and the allowed sources (ReliefWeb and its API, OCHA, WFP, IPC, Sana'a Center, Crisis Group, ACLED, Yemen Policy Center, Reuters, AP, Al Jazeera, Asharq Al-Awsat, Al-Masdar Online, South24, UKMTO, and both Saba agencies with attribution). Prefer primary and wire sources. If a site is blocked by the network, skip it and note it in the PR.
3. Select 3 to 6 developments that matter most, across these categories when relevant: security, politics, humanitarian, economy, maritime, regional, watch. Fewer slides on a quiet day is fine.
4. For each slide write:
   - English: category_label, title (under 90 characters), summary (2 to 3 sentences: what happened, where, why it matters), attribution.
   - Arabic: the same content written as natural Modern Standard Arabic, not a literal translation. Use official Arabic organization names.
   - location, used to mark the place on the site's map: include it only when the story has one clear place. Use the governorate or city center for land events, or a named sea area for maritime events (Red Sea off Hodeidah, Bab al-Mandab, Gulf of Aden). Never a street, village, or exact strike point. Give approximate lat/lon to two decimals, plus short name_en and name_ar. For every category except regional, coordinates must fall within latitude 10 to 20 and longitude 38 to 55. Omit location for nationwide or placeless stories.
   - sources: name, URL, publication date. At least one source per slide published in the last 36 hours. Casualty figures, attack claims, and claims about named people need two independent sources or explicit attribution.
5. Editorial rules: never invent facts, numbers, quotes or locations; neutral naming (the Houthis (Ansar Allah), the internationally recognized government / Presidential Leadership Council, the Southern Transitional Council); label partisan outlets; no graphic detail; no unverified social media; no em dashes; no hype words.
6. Write brief/archive/YYYY-MM-DD.json, copy it to brief/latest.json, and add the date to the top of brief/index.json. Set "status": "reviewed" (it only goes live after Hayl merges) and "generated_at" in UTC.
7. Run: python3 tools/validate_brief.py brief/latest.json. Fix every error before continuing.
8. Create branch brief/YYYY-MM-DD from the latest main, commit with message "Yemen Daily Brief YYYY-MM-DD", push, and open a pull request to main. If a branch or PR for today already exists, update it instead of creating another.
   PR title: "Yemen Daily Brief: <date>"
   PR body: a numbered list of the slides (English title, one-line summary, source links), then the Arabic titles, then any items you left out because sourcing was weak, then any blocked sources.
9. If fewer than 3 developments meet the sourcing bar, do not open a pull request. Instead end with a short note explaining why.
10. Do not modify any file outside brief/. Do not merge the pull request yourself.
```

---

## 9. Your checklist

1. Start a new session in this environment and paste Prompt A plus sections 3 to 5 (including 4b). Allow `cdn.jsdelivr.net` in the network settings too, so the session can load the map data while testing.
2. When it shows you screenshots, approve or ask for changes.
3. In the environment's network settings, add the source domains from section 5.
4. Let the build session create the scheduled task with Prompt B and fire it once.
5. Install the GitHub mobile app and turn on notifications for this repo, so each day's PR reaches your phone. Review, then tap Merge.
6. After a week, tell any session what to adjust (length, categories, tone, sources).

Risks to keep in mind:
- A news site may block automated reading; the brief then leans on wires and ReliefWeb. That is fine.
- The task cannot see paywalled articles; it will cite only what it can read.
- If you skip merging for 3 days, the band hides itself automatically, so the site never shows a stale brief as current.
