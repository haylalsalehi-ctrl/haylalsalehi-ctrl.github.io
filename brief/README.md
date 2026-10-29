# Yemen Daily Brief

A short daily summary of the last 24 hours in Yemen, shown as a slide band at the top of
https://haylalsalehi.com/ (English) and https://haylalsalehi.com/ar/ (Arabic). A scheduled
task drafts each day's brief and opens a pull request. It goes live only after Hayl
Al-Salehi reviews and merges it.

This README, `schema.json` and `tools/` are excluded from the public site in `_config.yml`.

## Files

| Path | Purpose |
|---|---|
| `brief/latest.json` | The brief the site shows. Always an exact copy of the newest archive file. |
| `brief/archive/YYYY-MM-DD.json` | Permanent record of each day's brief. |
| `brief/index.json` | `{"dates": [...]}`, newest first, one entry per archive file. |
| `brief/schema.json` | JSON Schema (draft 2020-12) for one day's brief. |
| `tools/validate_brief.py` | Validator (Python 3 standard library). Run before every commit. |

```
python3 tools/validate_brief.py brief/latest.json
```

When given `latest.json`, the validator also checks that the archive copy matches and that
`index.json` lists the date first.

## Data format

Top level: `date` (Yemen date, `YYYY-MM-DD`), `generated_at` (UTC, `2026-10-30T17:38:00Z`),
`status` (`reviewed` for real briefs, `sample` for test data, which shows a "Sample" badge),
and `slides` (3 to 6).

Each slide has:

- `id`: lowercase with hyphens, unique in the file, for example `maritime-1`.
- `category`: one of `security` (frontlines and attacks), `politics` (government, PLC,
  Houthis, STC, diplomacy and talks), `humanitarian`, `economy` (currency, salaries, fuel,
  banking), `maritime` (Red Sea, Bab al-Mandab, Gulf of Aden), `regional` (Saudi, UAE, Iran,
  US, Israel actions affecting Yemen), `watch` (what to watch in the next days).
- `en` and `ar`: each with `category_label`, `title` (English under 90 characters),
  `summary` (2 to 3 sentences: what happened, where, why it matters) and `attribution`.
- `location` (optional): `name_en`, `name_ar`, `lat`, `lon`. It marks the place on the
  site's background map and appears as a chip on the slide.
- `sources`: at least one `{name, url, published}`; `url` must be `https://`.

### Location rules

- Omit `location` when a story has no single place (a nationwide currency change, talks
  with no venue). The map then shows no marker for that slide.
- Use the governorate or city centre for land events and a named sea area for maritime
  events (Red Sea off Hodeidah, Bab al-Mandab, Gulf of Aden). Never a street, village or
  exact strike point. Two decimals are enough.
- Coordinates must fall inside the map: latitude 12 to 41, longitude -17 to 62. Every
  category except `regional` must also fall inside latitude 10 to 20, longitude 38 to 55
  (Yemen, Socotra and nearby seas).

Example place names: Sana'a / صنعاء (15.35, 44.21), Aden / عدن (12.79, 45.03),
Hodeidah / الحديدة (14.80, 42.95), Marib / مأرب (15.46, 45.32), Taiz / تعز (13.58, 44.02),
Bab al-Mandab / باب المندب (12.60, 43.33), Gulf of Aden / خليج عدن (12.50, 47.50).

## Editorial rules

1. Every slide needs at least one source link published within the last 36 hours.
   Casualty figures, attack claims, and claims about named people need two independent
   sources or an explicit attribution ("Houthi-run Saba reported...").
2. Never invent facts, numbers, quotes, or locations. If unsure, leave it out.
3. Neutral naming: "the Houthis (Ansar Allah)", "the internationally recognized government"
   or "the Presidential Leadership Council (PLC)", "the Southern Transitional Council
   (STC)". Name partisan outlets as partisan.
4. No graphic detail, no speculation about individuals, no unverified social media posts.
5. Quiet day: publish fewer slides (minimum 3). If fewer than 3 slides meet the sourcing
   bar, do not open a pull request; post a note in the session instead.
6. English and Arabic must say the same thing. Arabic is written as natural Modern Standard
   Arabic, not word-for-word translation. Use official Arabic names of organizations.
7. Style: plain, concise, no em dashes (the validator rejects em and en dashes), no hype
   words ("shocking", "unprecedented" unless quoted).
8. Do not duplicate yesterday's slides unless there is a new development; say what is new.

## Suggested sources

- Humanitarian: reliefweb.int (and api.reliefweb.int), unocha.org, wfp.org, ipcinfo.org,
  unicef.org
- Analysis: sanaacenter.org, crisisgroup.org, acleddata.com, yemenpolicy.org
- Wires and outlets: reuters.com, apnews.com, aljazeera.com, aljazeera.net, aawsat.com,
  almasdaronline.com, south24.net
- Maritime: ukmto.org
- Official outlets (always attribute): sabanew.net (government Saba), saba.ye (Houthi-run
  Saba)

## How the site uses it

`site.js` fetches `/brief/latest.json` once. `/` renders the `en` blocks and `/ar/` the `ar`
blocks (right to left). The band is hidden if the file is missing or invalid, or if
`generated_at` is more than 72 hours old. Between 24 and 72 hours it shows "Last updated
{date}" instead of the date. So if no brief is merged for three days, the band hides itself.

## Daily workflow

1. The scheduled task writes `brief/archive/YYYY-MM-DD.json`, copies it to
   `brief/latest.json`, and adds the date to the top of `brief/index.json`.
2. It runs the validator and fixes every error.
3. It pushes branch `brief/YYYY-MM-DD` and opens a pull request titled
   "Yemen Daily Brief: <date>". It never edits files outside `brief/` and never merges.
4. Hayl reviews and merges; GitHub Pages redeploys in about a minute.
