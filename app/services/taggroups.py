from pathlib import Path
import configparser

def parse_taggroups(path: Path):
    parser = configparser.ConfigParser()
    parser.read(path)

    groups = []
    position = 0

    for section in parser.sections():
        if not section.startswith("group."):
            continue

        group_id = section.replace("group.", "")
        cfg = parser[section]

        groups.append({
            "id": group_id,
            "description": cfg.get("description"),
            "required": cfg.getboolean("required", fallback=False),
            "min_count": cfg.getint("min", fallback=0),
            "max_count": cfg.getint("max", fallback=-1),
            "position": position,
        })
        position += 1

    return groups
