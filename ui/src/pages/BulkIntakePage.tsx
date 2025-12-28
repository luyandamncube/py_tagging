import { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

import TagsPanel from "../components/tags/TagsPanel";
import { useTagGroupsWithTags } from "../hooks/useTagGroupsWithTags";
import { ensureTag } from "../api/tags";
import "./bulk-intake.css";

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
  setRightPanel: (node: React.ReactNode) => void;
};

export default function BulkIntakePage() {
  const { setRightPanel } = useOutletContext<LayoutContext>();

  const [text, setText] = useState("");
  const [site, setSite] = useState("");
  const [creator, setCreator] = useState("");
  const [type, setType] = useState("image");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [dbDuplicates, setDbDuplicates] = useState<Set<string>>(new Set());
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [checkingDb, setCheckingDb] = useState(false);

  const {
    groups: tagGroups,
    loading: tagsLoading,
    error: tagsError,
    reload: reloadTags,
  } = useTagGroupsWithTags();

  // --------------------------------------------------
  // Tag handlers (must be defined before useEffect)
  // --------------------------------------------------

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }

  const handleCreateTag = async (groupId: string, label: string) => {
    await ensureTag(groupId, label);
    reloadTags();
  };

  // --------------------------------------------------
  // URL parsing / validation
  // --------------------------------------------------

  const lines = useMemo<LineValidation[]>(() => {
    const seen = new Set<string>();

    return text.split("\n").map((raw) => {
      const url = raw.trim();

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
  }, [text, dbDuplicates, checkingDb]);

  const validUrls = lines.filter((l) => l.status === "ok");
  const invalidCount = lines.filter(
    (l) => l.status === "error" || l.status === "duplicate-db"
  ).length;

  // --------------------------------------------------
  // DB duplicate check
  // --------------------------------------------------

  useEffect(() => {
    const urls = Array.from(
      new Set(
        text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => /^https?:\/\//i.test(l))
      )
    );

    if (!urls.length) {
      setDbDuplicates(new Set());
      return;
    }

    setCheckingDb(true);
    const timeout = setTimeout(async () => {
      const res = await fetch(`${API_BASE}/content/check-duplicates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      if (res.ok) {
        const data = await res.json();
        setDbDuplicates(new Set<string>(data.existing));
      }

      setCheckingDb(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, [text]);

  // --------------------------------------------------
  // Right panel wiring (desktop only)
  // --------------------------------------------------

    useEffect(() => {
      setRightPanel(
        <TagsPanel
          groups={tagGroups}
          loading={tagsLoading}
          selectedTagIds={selectedTagIds}
          onToggleTag={toggleTag}
          onCreateTag={handleCreateTag}
        />
      );
    }, [
      setRightPanel,
      tagGroups,
      tagsLoading,
      selectedTagIds,
    ]);

  useEffect(() => {
    return () => {
      setRightPanel(null);
    };
  }, [setRightPanel]);

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  async function handleSubmit() {
    if (!validUrls.length || invalidCount > 0) return;

    setLoading(true);
    setResult(null);

    const items = validUrls.map((l) => ({
      url: l.url,
      site: site || null,
      creator: creator || null,
      type,
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
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="page">
      <header className="page-header">
        <h1>Bulk URL Intake</h1>
        <p>Add multiple items and apply shared metadata & tags.</p>
      </header>

      {/* Metadata */}
      <section className="card">
        <div className="form-row">
          <div className="form-field">
            <label>Site</label>
            <input value={site} onChange={(e) => setSite(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Creator</label>
            <input
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
        </div>
      </section>

      {/* URLs */}
      <section className="card">
        <div className="card-header">
          <span>URLs</span>
          <span className="hint">One per line · live validation</span>
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
      <section className="card">
        <div className="tags-inline">
          <TagsPanel
            groups={tagGroups}
            loading={tagsLoading}
            selectedTagIds={selectedTagIds}
            onToggleTag={toggleTag}
            onCreateTag={handleCreateTag}
          />
        </div>
      </section>
      {/* Actions */}
      <footer className="page-actions">
        <div className="summary">
          Valid {validUrls.length} · Invalid {invalidCount}
        </div>

        <button
          className="primary"
          onClick={handleSubmit}
          disabled={loading || !validUrls.length || invalidCount > 0}
        >
          {loading ? "Adding…" : "Add URLs"}
        </button>
      </footer>

      {result && <div className="result">{result}</div>}
      {tagsError && <div className="error">{tagsError}</div>}
    </div>
  );
}
