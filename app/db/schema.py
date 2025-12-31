import os

def init_schema(con):
    reset = os.getenv("DB_RESET", "false").lower() == "true"

    if reset:
        print("⚠️  DB_RESET=true → dropping tables")

        # Child tables FIRST
        con.execute("DROP TABLE IF EXISTS content_preview")
        con.execute("DROP TABLE IF EXISTS content_tag")

        # Then parents
        con.execute("DROP TABLE IF EXISTS tag")
        con.execute("DROP TABLE IF EXISTS tag_group")
        con.execute("DROP TABLE IF EXISTS content")
    # -------------------------
    # Content
    # -------------------------
    con.execute("""
        CREATE TABLE IF NOT EXISTS content (
            id TEXT PRIMARY KEY,
            url TEXT,
            site TEXT,
            creator TEXT,
            type TEXT,
            status TEXT DEFAULT 'new',
            created_at TIMESTAMP
        )
    """)

    con.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_content_url
        ON content(url);
    """)

    # -------------------------
    # Tag groups
    # -------------------------
    con.execute("""
        CREATE TABLE IF NOT EXISTS tag_group (
            id TEXT PRIMARY KEY,
            description TEXT,
            required BOOLEAN,
            min_count INTEGER,
            max_count INTEGER,
            position INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # -------------------------
    # Tags
    # -------------------------
    con.execute("""
        CREATE TABLE IF NOT EXISTS tag (
            id TEXT PRIMARY KEY,
            label TEXT,
            category TEXT,
            group_id TEXT,
            usage_count INTEGER DEFAULT 0,
            last_used TIMESTAMP
        )
    """)

    # -------------------------
    # Content ↔ Tag
    # -------------------------
    con.execute("""
        CREATE TABLE IF NOT EXISTS content_tag (
            content_id TEXT,
            tag_id TEXT
        )
    """)

    con.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS ux_content_tag
        ON content_tag (content_id, tag_id)
    """)

    # -------------------------
    # Content Preview (derived)
    # -------------------------
    con.execute("""
        CREATE TABLE IF NOT EXISTS content_preview (
            content_id TEXT PRIMARY KEY,
            preview_type TEXT,          -- image | video | page | unknown
            preview_url TEXT,
            preview_url_normalized TEXT,
            title TEXT,
            description TEXT,
            preview_status TEXT,        -- pending | ready | failed
            fetched_at TIMESTAMP,
            FOREIGN KEY (content_id) REFERENCES content(id)
        )
    """)

    con.execute("""
        CREATE INDEX IF NOT EXISTS idx_preview_status
        ON content_preview(preview_status)
    """)