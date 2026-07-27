import json
import os
import sys
from datetime import datetime, timezone


def main():
    if not os.getenv("KAGGLE_API_TOKEN") and not os.getenv("KAGGLE_USERNAME"):
        print(json.dumps({"skipped": "missing_credentials", "competitions": []}))
        return

    from kaggle.api.kaggle_api_extended import KaggleApi

    api = KaggleApi()
    api.authenticate()
    rows = []
    for category in ["featured", "research", "gettingStarted", "playground"]:
        for page in [1, 2]:
            try:
                competitions = api.competitions_list(
                    group="general",
                    category=category,
                    sort_by="latestDeadline",
                    page=page,
                )
            except Exception as exc:
                print(f"Kaggle fetch warning: {category} page {page}: {exc}", file=sys.stderr)
                continue
            for item in competitions:
                raw = getattr(item, "__dict__", {})
                ref = raw.get("ref") or getattr(item, "ref", None)
                title = raw.get("title") or getattr(item, "title", None) or ref
                deadline = raw.get("deadline") or getattr(item, "deadline", None)
                if not ref or not deadline:
                    continue
                if hasattr(deadline, "isoformat"):
                    deadline = deadline.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
                rows.append({
                    "ref": ref,
                    "title": title,
                    "deadline": str(deadline),
                    "category": raw.get("category") or category,
                    "reward": raw.get("reward") or getattr(item, "reward", None),
                    "teamCount": raw.get("teamCount") or getattr(item, "teamCount", None),
                    "description": raw.get("description") or getattr(item, "description", None),
                })

    print(json.dumps({
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "competitions": rows,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
