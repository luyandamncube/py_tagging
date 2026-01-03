import { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

import TagsPanelShell from "../components/tags/TagsPanelShell";
import "./bulk-intake.css";
import ContentPreviewView from "../components/ContentPreview"

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";

const LINE_HEIGHT = 24;

type LineStatus = "ok" | "error" | "duplicate-db" | "empty";

type LineValidation = {
  url: string;
  status: LineStatus;
  reason?: string;
};

type LayoutContext = {
  setRightPanel: (node: React.ReactNode | null) => void;
};

type ExpandedItem = {
  url: string;
  preview_type: "image" | "video" | "page" | "unknown";
  preview_url: string | null;
  preview_url_normalized?: string | null;
  source_url: string;
  duplicate?: boolean;
};

type ExpandedResult = {
  input_url: string;
  type: "single" | "gallery" | "unknown";
  items: ExpandedItem[];
};

export default function BulkIntakePage() {
  const { setRightPanel } = useOutletContext<LayoutContext>();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [dbDuplicates, setDbDuplicates] = useState<Set<string>>(new Set());
  const [checkingDb, setCheckingDb] = useState(false);

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [expanded, setExpanded] = useState<ExpandedResult[] | null>(null);
  const [expanding, setExpanding] = useState(false);
  const [expandError, setExpandError] = useState<string | null>(null);

  // --------------------------------------------------
  // Tag selection
  // --------------------------------------------------

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }

  // --------------------------------------------------
  // Parse raw lines (pure)
  // --------------------------------------------------

  const rawLines = useMemo(
    () => text.split("\n").map((l) => l.trim()),
    [text]
  );

  // --------------------------------------------------
  // Validate lines
  // --------------------------------------------------

  const lines = useMemo<LineValidation[]>(() => {
    const seen = new Set<string>();

    return rawLines.map((url) => {
      if (!url) return { url: "", status: "empty" };

      if (!/^https?:\/\//i.test(url))
        return { url, status: "error", reason: "Invalid URL" };

      if (seen.has(url))
        return { url, status: "error", reason: "Duplicate in list" };

      seen.add(url);

      if (checkingDb)
        return { url, status: "ok", reason: "Checking…" };

      if (dbDuplicates.has(url))
        return { url, status: "duplicate-db", reason: "Already exists" };

      return { url, status: "ok" };
    });
  }, [rawLines, dbDuplicates, checkingDb]);

  const validUrls = lines.filter((l) => l.status === "ok");
  const invalidCount = lines.filter(
    (l) => l.status === "error" || l.status === "duplicate-db"
  ).length;


  const expandedItemCount =
    expanded?.reduce((sum, g) => sum + g.items.length, 0) ?? 0;

  const canSubmit =
    validUrls.length > 0 &&
    invalidCount === 0 &&
    !loading &&
    !expanding &&
    (expanded === null || expandedItemCount > 0);


  const canExpand =
    validUrls.length > 0 &&
    invalidCount === 0 &&
    !loading &&
    !expanding;


  // --------------------------------------------------
  // DB duplicate check (debounced)
  // --------------------------------------------------

  useEffect(() => {
    const urls = Array.from(
      new Set(
        rawLines.filter((l) => /^https?:\/\//i.test(l))
      )
    );

    if (!urls.length) {
      setDbDuplicates(new Set());
      return;
    }

    setCheckingDb(true);

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/content/check-duplicates`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urls }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          setDbDuplicates(new Set<string>(data.existing));
        }
      } finally {
        setCheckingDb(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [rawLines]);

  // --------------------------------------------------
  // Shared Tags Panel (single source of truth)
  // --------------------------------------------------

  const tagsPanel = useMemo(
    () => (
      <TagsPanelShell
        selectedTagIds={selectedTagIds}
        onToggleTag={toggleTag}
      />
    ),
    [selectedTagIds]
  );


  // Desktop: right panel
  useEffect(() => {
    setRightPanel(tagsPanel);
    return () => setRightPanel(null);
  }, [setRightPanel, tagsPanel]);

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  async function handleSubmit() {
    if (!canSubmit) return;

    setLoading(true);
    setResult(null);

    const items = expanded
      ? expanded.flatMap((group) =>
        group.items.map((item) => ({
          url: item.url,
          source_url: item.source_url,
          tag_ids: selectedTagIds,
        }))
      )
      : validUrls.map((l) => ({
        url: l.url,
        tag_ids: selectedTagIds,
      }));



    try {
      const res = await fetch(`${API_BASE}/content/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setResult(`✅ Added ${data.created} items`);
      setText("");
      setDbDuplicates(new Set());
      setSelectedTagIds([]);
    } catch {
      setResult("❌ Failed to add items");
    } finally {
      setLoading(false);
    }
    setExpanded(null);

  }

  async function handleExpand() {
    setExpanding(true);
    setExpandError(null);

    try {
      const res = await fetch(`${API_BASE}/content/expand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: validUrls.map(v => v.url),
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      const results: ExpandedResult[] = data.results;

      setExpanded(results);

      // --------------------------------------------------
      // 🔎 Check duplicates for expanded items
      // --------------------------------------------------
      try {
        const dupRes = await fetch(`${API_BASE}/content/check-duplicates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: flattenExpandedItems(results),
          }),
        });

        if (dupRes.ok) {
          const dupData = await dupRes.json();
          const existing = dupData.existing ?? [];

          const dupSet = new Set(
            existing.map(
              (e: any) => `${e.source_url}::${e.url}`
            )
          );

          setExpanded((prev) => {
            if (!prev) return prev;

            return prev.map((group) => ({
              ...group,
              items: group.items.map((item) => ({
                ...item,
                duplicate: dupSet.has(
                  `${item.source_url}::${item.url}`
                ),
              })),
            }));
          });
        }
      } catch {
        // best-effort only
      }

    } catch {
      setExpandError("Failed to expand URLs");
    } finally {
      setExpanding(false);
    }
  }


  function removeExpandedItem(
    inputUrl: string,
    itemUrl: string
  ) {
    setExpanded((prev) => {
      if (!prev) return prev;

      return prev.map((group) => {
        if (group.input_url !== inputUrl) return group;

        return {
          ...group,
          items: group.items.filter(
            (item) => item.url !== itemUrl
          ),
        };
      });
    });
  }

  function flattenExpandedItems(expanded: ExpandedResult[]) {
    return expanded.flatMap((group) =>
      group.items.map((item) => ({
        url: item.url,
        source_url: item.source_url,
      }))
    );
  }

  useEffect(() => {
    setExpanded(null);
    setExpandError(null);
  }, [text]);


  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="page">
      <section className="card">
        <div className="card-header">
          <span>URLs</span>
          <span className="hint">One per line · live validation</span>
          <div className="summary">
            Valid {validUrls.length} · Invalid {invalidCount}
          </div>
        </div>

        <div className="url-editor">
          <div className="url-status">
            {lines.map((l, i) => (
              <div
                key={i}
                className={`status ${l.status}`}
                style={{ height: LINE_HEIGHT }}
              />
            ))}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />

          <div className="url-reasons">
            {lines.map((l, i) => (
              <div key={i} style={{ height: LINE_HEIGHT }}>
                {l.reason}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile-only tags */}
      <section className="card tags-inline">
        {tagsPanel}
      </section>

      {result && <div className="result">{result}</div>}
      <footer className="page-actions">


        <button
          onClick={handleExpand}
          disabled={!canExpand || expanded !== null}
        >
          {expanding ? "Expanding…" : "Expand galleries"}
        </button>

        <button
          className="primary"
          onClick={handleSubmit}
          disabled={!canSubmit}

        >

          {loading ? "Adding…" : "Add URLs"}
        </button>
      </footer>
      {expanded && expanded.map((group) => (
        <section key={group.input_url} className="card">
          <strong>
            Expanded {expanded.length} URLs →{" "}
            {expanded.reduce((sum, r) => sum + r.items.length, 0)} items
          </strong>
          <div className="group-header">
            {group.input_url}
            {group.items.length === 0 && " (no media found)"}
          </div>

          <div className="preview-scroll">
            <div className="preview-grid">
              {group.items.map((item) => (
                <div
                  className={`preview-item ${item.duplicate ? "duplicate" : ""}`}
                  key={`${group.input_url}::${item.url}`}
                >
                  {item.duplicate && (
                    <div className="duplicate-badge">
                      Already added
                    </div>
                  )}

                  <button
                    className="remove-item"
                    onClick={() =>
                      removeExpandedItem(group.input_url, item.url)
                    }
                    title="Remove item"
                  >
                    ×
                  </button>

                  <ContentPreviewView
                    preview={{
                      status: "ready",
                      preview_type: item.preview_type,
                      url: item.preview_url,
                      url_normalized: item.preview_url_normalized,
                    }}
                    disableInteraction
                  />
                </div>


              ))}
            </div>
          </div>
        </section>
      ))}

      {expandError && (
        <div className="error">
          {expandError}
        </div>
      )}



    </div>
  );
}
