#!/usr/bin/env python3
"""Fetch real universities from the Hipolabs Universities API for our 8
supported countries, compare against what's already in the DB, and insert
only the ones that are genuinely missing.

Hipolabs (http://universities.hipolabs.com) is hit directly via `requests`
here — no GitHub-hosted client wrapper package. It only returns name,
country, state-province, domains, and web_pages — no admissions data, so
inserted rows get honest, non-fabricated defaults for the fields Hipolabs
doesn't cover (climate is inferred from state-province name where possible,
baselineSelectivity is a generic curated placeholder with no
actualAcceptanceRate/acceptanceRateSource set, since we have no real rate to
cite for these). Matches the "seed-universities-us-scorecard-round1.mjs"
convention already in this repo: real names/links from a real source, honest
generic defaults elsewhere, never an invented statistic.

Usage: python3 scripts/fetch_hipolabs_universities.py [--dry-run] [--limit N]
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

import requests
import psycopg2
import psycopg2.extras

HIPOLABS_BASE = "http://universities.hipolabs.com/search"

# Hipolabs country name -> our internal country code
COUNTRIES = {
    "United States": "US",
    "United Kingdom": "UK",
    "Australia": "AU",
    "Singapore": "SG",
    "Hong Kong": "HK",
    "India": "IN",
    "Germany": "DE",
    "France": "FR",
}

STOPWORDS = {"the", "of", "and", "at", "a", "&", "main", "campus"}

# Hipolabs' global list mixes in a lot of non-university entries: K-12
# schools, regional education-ministry admin offices, seminaries, and
# non-degree vocational/diploma institutions. Filtered out by name pattern
# rather than trusted wholesale — spotted these specific categories by
# eyeballing a sample from each country before the real insert.
EXCLUDE_NAME_PATTERNS = [
    re.compile(r"^acad[ée]mie\s+d[e']", re.IGNORECASE),  # French regional education-ministry offices, not universities
    re.compile(r"international school", re.IGNORECASE),  # K-12, not higher-ed, in this dataset
    re.compile(r"theolog|seminary|\bbible\b", re.IGNORECASE),
    re.compile(r"cosmetology|culinary|barber|beauty\s+college|massage", re.IGNORECASE),
    re.compile(r"correspondence\s+school", re.IGNORECASE),
    re.compile(r"community college", re.IGNORECASE),  # 2-year, not bachelor's-granting
    re.compile(r"\btafe\b", re.IGNORECASE),  # Australian vocational/diploma system, not a university
    re.compile(r"board of alternative medicine", re.IGNORECASE),
]

# Singapore's polytechnics and ITE are real post-secondary institutions but
# grant diplomas, not bachelor's degrees — not a fit for a "which university"
# shortlist tool. Only excluded for SG; "Polytechnic" is part of many real
# bachelor's-granting US/AU university names (Cal Poly, Virginia Tech) so
# this is NOT a global exclusion.
SG_NON_DEGREE_PATTERN = re.compile(r"polytechnic|institute of technical education", re.IGNORECASE)


def is_excluded(name: str, country_code: str) -> bool:
    if any(p.search(name) for p in EXCLUDE_NAME_PATTERNS):
        return True
    if country_code == "SG" and SG_NON_DEGREE_PATTERN.search(name):
        return True
    return False


def tokens(name: str) -> set:
    cleaned = re.sub(r"[^a-z0-9\s]", " ", name.lower())
    return {t for t in cleaned.split() if t and t not in STOPWORDS}


def is_duplicate(candidate_name: str, existing_token_sets, threshold: float = 0.85) -> bool:
    ctoks = tokens(candidate_name)
    if not ctoks:
        return True  # empty/garbage name, treat as unusable rather than insertable
    for etoks in existing_token_sets:
        if not etoks:
            continue
        inter = len(ctoks & etoks)
        ratio = inter / min(len(ctoks), len(etoks))
        if ratio >= threshold:
            return True
    return False


def fetch_country(country_name: str) -> list:
    resp = requests.get(HIPOLABS_BASE, params={"country": country_name}, timeout=30)
    resp.raise_for_status()
    return resp.json()


WARM_KEYWORDS = ("florida", "texas", "arizona", "georgia", "louisiana", "mississippi",
                  "alabama", "south carolina", "hawaii", "nevada", "new mexico",
                  "california", "queensland", "northern territory", "tamil nadu",
                  "karnataka", "kerala", "andhra", "telangana", "maharashtra", "goa")
COLD_KEYWORDS = ("minnesota", "north dakota", "south dakota", "wisconsin", "michigan",
                  "maine", "vermont", "new hampshire", "montana", "alaska", "wyoming",
                  "idaho", "new york", "massachusetts", "connecticut", "rhode island",
                  "pennsylvania", "ohio", "illinois", "indiana", "iowa", "nebraska",
                  "colorado", "utah", "scotland", "bavaria", "saxony", "berlin",
                  "brandenburg", "himachal", "kashmir", "uttarakhand", "punjab")


def climate_for(state_province: str) -> str:
    if not state_province:
        return "Balanced"
    s = state_province.lower()
    if any(k in s for k in WARM_KEYWORDS):
        return "Warm"
    if any(k in s for k in COLD_KEYWORDS):
        return "Cold"
    return "Balanced"


GENERIC_REQUIREMENTS = {
    "US": ["SAT/ACT (test-optional at most)", "Application essay", "GPA and coursework rigor"],
    "UK": ["A-Level or equivalent qualifications", "Personal statement", "Subject-specific prerequisites vary by course"],
    "AU": ["ATAR or equivalent qualifications", "Subject prerequisites vary by course"],
    "SG": ["A-Level/IB or equivalent qualifications", "Subject prerequisites vary by course"],
    "HK": ["HKDSE or equivalent qualifications", "Subject prerequisites vary by course"],
    "IN": ["CUET or relevant entrance exam", "Class 12 board qualification"],
    "DE": ["Abitur or recognized equivalent (Hochschulzugangsberechtigung)", "Program-specific prerequisites vary"],
    "FR": ["Baccalauréat or recognized equivalent", "Parcoursup application", "Program-specific prerequisites vary"],
}

GENERIC_ACADEMIC_FIELDS = ["Business", "Social Sciences", "Science & Technology / Research"]


def build_row(entry: dict, country_code: str) -> dict:
    name = entry.get("name", "").strip()
    state_province = entry.get("state-province")
    web_pages = entry.get("web_pages") or []
    link = web_pages[0] if web_pages else ""
    location = state_province if state_province else COUNTRIES_REVERSE.get(country_code, country_code)
    return {
        "name": name,
        "country": country_code,
        "location": location,
        "climate": climate_for(state_province),
        "sectors": ["General"],
        # No real rate available from this source — a generic, unsourced
        # curated placeholder (same convention the schema already documents
        # for baselineSelectivity), NOT derived from any fabricated rate.
        "baselineSelectivity": 60,
        "internshipProgram": f"A university in {location} offering undergraduate programs across multiple fields of study.",
        "requirements": GENERIC_REQUIREMENTS.get(country_code, ["Standard entrance qualifications for the country"]),
        "link": link,
        "academicFields": GENERIC_ACADEMIC_FIELDS,
    }


COUNTRIES_REVERSE = {v: k for k, v in COUNTRIES.items()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Fetch and diff only, don't write to the DB")
    parser.add_argument("--limit", type=int, default=None, help="Cap total inserted rows (across all countries)")
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("Set DATABASE_URL (e.g. run with --env-file=.env.local via a wrapper, or export it first)", file=sys.stderr)
        sys.exit(1)

    conn = psycopg2.connect(database_url)
    cur = conn.cursor()

    cur.execute("SELECT name, country FROM universities")
    existing_rows = cur.fetchall()
    existing_by_country = {}
    for name, country in existing_rows:
        existing_by_country.setdefault(country, []).append(name)

    all_missing = []

    for country_name, country_code in COUNTRIES.items():
        print(f"Fetching {country_name} ({country_code}) from Hipolabs...")
        try:
            entries = fetch_country(country_name)
        except requests.RequestException as e:
            print(f"  Failed to fetch {country_name}: {e}", file=sys.stderr)
            continue
        print(f"  Hipolabs returned {len(entries)} entries")

        existing_names = existing_by_country.get(country_code, [])
        existing_token_sets = [tokens(n) for n in existing_names]

        seen_this_country = set()
        country_missing = []
        for entry in entries:
            name = (entry.get("name") or "").strip()
            if not name:
                continue
            key = name.lower()
            if key in seen_this_country:
                continue  # Hipolabs itself has some duplicate rows per country
            seen_this_country.add(key)
            if is_excluded(name, country_code):
                continue
            if is_duplicate(name, existing_token_sets):
                continue
            country_missing.append(build_row(entry, country_code))

        print(f"  {len(country_missing)} genuinely missing (not already in DB, deduped)")
        all_missing.extend(country_missing)
        time.sleep(0.3)  # polite delay between country requests

    print(f"\nTotal missing across all 8 countries: {len(all_missing)}")

    if args.limit is not None:
        all_missing = all_missing[: args.limit]
        print(f"Capped to --limit {args.limit}: inserting {len(all_missing)}")

    Path("/tmp/gen").mkdir(parents=True, exist_ok=True)
    with open("/tmp/gen/hipolabs_missing.json", "w") as f:
        json.dump(all_missing, f, indent=2)
    print("Saved full missing list to /tmp/gen/hipolabs_missing.json")

    if args.dry_run:
        print("Dry run — not writing to the database.")
        cur.close()
        conn.close()
        return

    inserted = 0
    for row in all_missing:
        cur.execute(
            """
            INSERT INTO universities
                (name, country, location, climate, sectors, "baselineSelectivity",
                 "internshipProgram", requirements, link, "academicFields")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                row["name"],
                row["country"],
                row["location"],
                row["climate"],
                json.dumps(row["sectors"]),
                row["baselineSelectivity"],
                row["internshipProgram"],
                json.dumps(row["requirements"]),
                row["link"],
                json.dumps(row["academicFields"]),
            ),
        )
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"\nInserted {inserted} new universities into the database.")


if __name__ == "__main__":
    main()
