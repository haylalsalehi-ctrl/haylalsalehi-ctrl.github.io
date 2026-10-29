#!/usr/bin/env python3
"""Validate a Yemen Daily Brief file against brief/schema.json and the
editorial rules in brief/README.md. Standard library only.

Usage:
    python3 tools/validate_brief.py brief/latest.json [more files...]

When a file named latest.json is checked, the script also checks that
brief/archive/<date>.json matches it and that brief/index.json lists
<date> first. Exit code 0 means valid; 1 means at least one error.
"""

import json
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

CATEGORIES = {"security", "politics", "humanitarian", "economy", "maritime", "regional", "watch"}
STATUSES = {"sample", "reviewed"}
TOP_KEYS = {"date", "generated_at", "status", "slides"}
SLIDE_KEYS = {"id", "category", "en", "ar", "location", "sources"}
LANG_KEYS = {"category_label", "title", "summary", "attribution"}
LOC_KEYS = {"name_en", "name_ar", "lat", "lon"}
SOURCE_KEYS = {"name", "url", "published"}
TITLE_MAX = {"en": 90, "ar": 110}
MAP_BOX = (12, 41, -17, 62)      # lat min, lat max, lon min, lon max
YEMEN_BOX = (10, 20, 38, 55)     # every category except regional
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
STAMP_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$")
ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
DASHES = ("—", "–")    # em dash, en dash


def parse_date(value):
    if not isinstance(value, str) or not DATE_RE.match(value):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def nonempty(value):
    return isinstance(value, str) and value.strip() != ""


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def check_brief(data):
    errors = []
    err = errors.append

    if not isinstance(data, dict):
        return ["top level must be an object"]
    for key in sorted(TOP_KEYS - data.keys()):
        err(f"missing top-level field '{key}'")
    for key in sorted(data.keys() - TOP_KEYS):
        err(f"unknown top-level field '{key}'")

    brief_date = parse_date(data.get("date"))
    if "date" in data and brief_date is None:
        err("date must be a real date in YYYY-MM-DD format")

    stamp = data.get("generated_at")
    if "generated_at" in data:
        if not isinstance(stamp, str) or not STAMP_RE.match(stamp):
            err("generated_at must be a UTC timestamp like 2026-10-30T17:38:00Z")
        else:
            try:
                datetime.fromisoformat(stamp.replace("Z", "+00:00"))
            except ValueError:
                err("generated_at is not a real date and time")

    if "status" in data and data["status"] not in STATUSES:
        err(f"status must be one of {sorted(STATUSES)}")

    slides = data.get("slides")
    if not isinstance(slides, list):
        if "slides" in data:
            err("slides must be an array")
        return errors
    if not 3 <= len(slides) <= 6:
        err(f"slides must contain 3 to 6 items (found {len(slides)})")

    seen_ids = set()
    for i, slide in enumerate(slides, 1):
        where = f"slide {i}"
        if not isinstance(slide, dict):
            err(f"{where}: must be an object")
            continue
        if isinstance(slide.get("id"), str):
            where = f"slide {i} ({slide['id']})"
        for key in sorted({"id", "category", "en", "ar", "sources"} - slide.keys()):
            err(f"{where}: missing field '{key}'")
        for key in sorted(slide.keys() - SLIDE_KEYS):
            err(f"{where}: unknown field '{key}'")

        sid = slide.get("id")
        if "id" in slide:
            if not isinstance(sid, str) or not ID_RE.match(sid):
                err(f"{where}: id must be lowercase letters, digits and hyphens")
            elif sid in seen_ids:
                err(f"{where}: duplicate id")
            else:
                seen_ids.add(sid)

        category = slide.get("category")
        if "category" in slide and category not in CATEGORIES:
            err(f"{where}: category must be one of {sorted(CATEGORIES)}")

        for lang in ("en", "ar"):
            block = slide.get(lang)
            if lang not in slide:
                continue
            if not isinstance(block, dict):
                err(f"{where}: {lang} must be an object")
                continue
            for key in sorted(LANG_KEYS - block.keys()):
                err(f"{where}: {lang}.{key} is missing")
            for key in sorted(block.keys() - LANG_KEYS):
                err(f"{where}: {lang}.{key} is not an allowed field")
            for key in sorted(LANG_KEYS & block.keys()):
                value = block[key]
                if not nonempty(value):
                    err(f"{where}: {lang}.{key} must be non-empty text")
                elif any(d in value for d in DASHES):
                    err(f"{where}: {lang}.{key} contains an em or en dash")
            title = block.get("title")
            if nonempty(title) and len(title) > TITLE_MAX[lang]:
                err(f"{where}: {lang}.title is {len(title)} characters (max {TITLE_MAX[lang]})")

        if "location" in slide:
            loc = slide["location"]
            if not isinstance(loc, dict):
                err(f"{where}: location must be an object (or be omitted)")
            else:
                for key in sorted(LOC_KEYS - loc.keys()):
                    err(f"{where}: location.{key} is missing")
                for key in sorted(loc.keys() - LOC_KEYS):
                    err(f"{where}: location.{key} is not an allowed field")
                for key in ("name_en", "name_ar"):
                    if key in loc and not nonempty(loc[key]):
                        err(f"{where}: location.{key} must be non-empty text")
                lat, lon = loc.get("lat"), loc.get("lon")
                if not (is_number(lat) and is_number(lon)):
                    err(f"{where}: location.lat and location.lon must be numbers")
                else:
                    if not (MAP_BOX[0] <= lat <= MAP_BOX[1] and MAP_BOX[2] <= lon <= MAP_BOX[3]):
                        err(f"{where}: location {lat}, {lon} is outside the map (lat 12 to 41, lon -17 to 62)")
                    if category != "regional" and not (
                        YEMEN_BOX[0] <= lat <= YEMEN_BOX[1] and YEMEN_BOX[2] <= lon <= YEMEN_BOX[3]
                    ):
                        err(f"{where}: location {lat}, {lon} is outside the Yemen box "
                            "(lat 10 to 20, lon 38 to 55); only regional slides may go further")

        sources = slide.get("sources")
        if "sources" in slide:
            if not isinstance(sources, list) or not sources:
                err(f"{where}: sources must be a non-empty array")
                continue
            recent = False
            for j, src in enumerate(sources, 1):
                sw = f"{where}: source {j}"
                if not isinstance(src, dict):
                    err(f"{sw} must be an object")
                    continue
                for key in sorted(SOURCE_KEYS - src.keys()):
                    err(f"{sw} is missing '{key}'")
                for key in sorted(src.keys() - SOURCE_KEYS):
                    err(f"{sw} has unknown field '{key}'")
                if "name" in src and not nonempty(src["name"]):
                    err(f"{sw} name must be non-empty text")
                url = src.get("url")
                if "url" in src and (not isinstance(url, str) or not re.match(r"^https://[^\s/]+\.[^\s]+$", url)):
                    err(f"{sw} url must be a full https:// link")
                pub = parse_date(src.get("published"))
                if "published" in src and pub is None:
                    err(f"{sw} published must be a real date in YYYY-MM-DD format")
                if pub and brief_date:
                    if pub > brief_date:
                        err(f"{sw} published {pub} is after the brief date {brief_date}")
                    elif pub >= brief_date - timedelta(days=1):
                        recent = True
            if brief_date and not recent:
                err(f"{where}: needs at least one source published on {brief_date} or the day before (36 hour rule)")

    return errors


def check_companions(path, data):
    """For brief/latest.json: archive copy and index.json must agree."""
    errors = []
    day = data.get("date") if isinstance(data, dict) else None
    if not isinstance(day, str) or not parse_date(day):
        return errors
    folder = path.parent
    archive = folder / "archive" / f"{day}.json"
    if not archive.exists():
        errors.append(f"{archive} is missing (latest.json must be a copy of it)")
    else:
        try:
            if json.loads(archive.read_text(encoding="utf-8")) != data:
                errors.append(f"{archive} differs from latest.json")
        except (ValueError, OSError) as exc:
            errors.append(f"{archive} could not be read: {exc}")
    index = folder / "index.json"
    try:
        dates = json.loads(index.read_text(encoding="utf-8")).get("dates")
        if not isinstance(dates, list) or not dates or dates[0] != day:
            errors.append(f"{index} must list {day} first in \"dates\"")
        elif len(set(dates)) != len(dates):
            errors.append(f"{index} has duplicate dates")
        elif dates != sorted(dates, reverse=True):
            errors.append(f"{index} dates must be newest first")
        else:
            for d in dates:
                if not (folder / "archive" / f"{d}.json").exists():
                    errors.append(f"{index} lists {d} but archive/{d}.json is missing")
    except (ValueError, OSError, AttributeError) as exc:
        errors.append(f"{index} could not be read: {exc}")
    return errors


def main(argv):
    if len(argv) < 2:
        print(__doc__.strip())
        return 1
    failed = False
    for name in argv[1:]:
        path = Path(name)
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError) as exc:
            print(f"{name}: cannot read JSON: {exc}")
            failed = True
            continue
        errors = check_brief(data)
        if path.name == "latest.json":
            errors += check_companions(path, data)
        if errors:
            failed = True
            print(f"{name}: {len(errors)} error(s)")
            for e in errors:
                print(f"  - {e}")
        else:
            count = len(data["slides"])
            print(f"{name}: valid ({data['date']}, {count} slides, status {data['status']})")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
