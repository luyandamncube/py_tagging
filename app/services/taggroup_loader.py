from pathlib import Path
import configparser
from app.db import get_db


TAGGROUPS_FILE = Path(".taggroups")


def load_taggroups_from_file():
    if not TAGGROUPS_FILE.exists():
        raise FileNotFoundError(f"{TAGGROUPS_FILE} not found")

    parser = configparser.ConfigParser()
    parser.read(TAGGROUPS_FILE)

    groups = []

    for section in parser.sections():
        if not section.startswith("group."):
            continue

        group_id = section.replace("group.", "").strip()

        cfg = parser[section]

        required = cfg.getboolean("required", fallback=False)
        description = cfg.get("description", fallback=None)
        min_count = cfg.getint("min", fallback=0)
        max_count = cfg.getint("max", fallback=-1)

        # normalize -1 → NULL (unlimited)
        max_count = None if max_count == -1 else max_count

        groups.append(
            {
                "id": group_id,
                "required": required,
                "description": description,
                "min_count": min_count,
                "max_count": max_count,
            }
        )

    return groups


def seed_taggroups():
    con = get_db()
    groups = load_taggroups_from_file()

    for pos, g in enumerate(groups):
        con.execute(
            """
            INSERT OR IGNORE INTO tag_group (
                id,
                description,
                required,
                min_count,
                max_count,
                position
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                g["id"],
                g["description"],
                g["required"],
                g["min_count"],
                g["max_count"],
                pos,
            ),
        )
