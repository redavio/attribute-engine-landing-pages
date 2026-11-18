"""Small JPEGs of a history run's screenshots, next to its results.json in runs/<client>/."""

import re
from pathlib import Path

from PIL import Image

from . import storage

SHOT_WIDTH = {"fold": 1440, "full": 1000}
SHOT_MAX_HEIGHT = 9000


def page_id(row):
    name = re.sub(r"[^a-z0-9]+", "-", row["url"].lower()).strip("-") or "home"
    return f"{name}-{row['captured_at']}"


def shot_url(screenshot):
    return "history-shots/" + Path(screenshot).with_suffix(".jpg").name


def save_shot(source, target, width):
    image = Image.open(source).convert("RGB")
    if image.width > width:
        image = image.resize((width, round(image.height * width / image.width)))
    image.crop((0, 0, image.width, min(image.height, SHOT_MAX_HEIGHT))).save(target, quality=72)


def publish(client, rows):
    shots = storage.run_dir(client) / "history-shots"
    shots.mkdir(parents=True, exist_ok=True)
    run = storage.run_dir(client)
    for row in rows:
        for kind in ("fold", "full"):
            shot = row[f"{kind}_screenshot"]
            target = shots / Path(shot).with_suffix(".jpg").name
            if (run / shot).stat().st_mtime > (target.stat().st_mtime if target.exists() else 0):
                save_shot(run / shot, target, SHOT_WIDTH[kind])
    used = {Path(row[f"{kind}_screenshot"]).with_suffix(".jpg").name for row in rows for kind in ("fold", "full")}
    for old in shots.iterdir():
        if old.name not in used:
            old.unlink()
