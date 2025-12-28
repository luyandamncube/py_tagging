import { useState, useMemo, useEffect } from "react";
import BulkTagSelector from "../components/tags/BulkTagSelector";
import { useTagGroupsWithTags } from "../hooks/useTagGroupsWithTags";
import { ensureTag } from "../api/tags";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";

const LINE_HEIGHT = 22;

type LineStatus = "ok" | "error" | "duplicate-db" | "empty";

type LineValidation = {
  url: string;
  status: LineStatus;
  reason?: string;
};

export default function BulkIntakePage() {
  const [text, setText] = useState("");
  const [site, setSite] = useState("");
  const [creator, setCreator] = useState("");
  const [type, setType] = useState("image");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [dbDuplicates, setDbDuplicates] = useState<Set<string>>(new Set());
//   const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
 const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [checkingDb, setCheckingDb] = useState(false);

  // -----------------------------
  // Load tag groups + tags
  // -----------------------------
    const {
    groups: tagGroups,
    loading: tagsLoading,
    error: tagsError,
    reload: reloadTags,
    } = useTagGroupsWithTags();


  // -----------------------------
  // Parse + validate lines
  // -----------------------------
const lines = useMemo<LineValidation[]>(() => {
  const seen = new Set<string>();

  return text.split("\n").map((raw) => {
    const url = raw.trim();

    if (!url) {
      return { url: "", status: "empty" };
    }

    if (!/^https?:\/\//i.test(url)) {
      return { url, status: "error", reason: "Invalid URL" };
    }

    if (seen.has(url)) {
      return { url, status: "error", reason: "Duplicate in list" };
    }

    seen.add(url);

    if (checkingDb) {
      return { url, status: "ok", reason: "Checking…" };
    }

    if (dbDuplicates.has(url)) {
      return { url, status: "duplicate-db", reason: "Already exists" };
    }

    return { url, status: "ok" };
  });
}, [text, dbDuplicates, checkingDb]);

  const validUrls = lines.filter((l) => l.status === "ok");

  const invalidCount = lines.filter(
    (l) => l.status === "error" || l.status === "duplicate-db"
  ).length;

  // -----------------------------
  // DB duplicate checker
  // -----------------------------
    useEffect(() => {
    const urls = Array.from(
        new Set(
        text
            .split("\n")
            .map(l => l.trim())
            .filter(l => /^https?:\/\//i.test(l))
        )
    );

    if (urls.length === 0) {
        setDbDuplicates(new Set());
        return;
    }

    setCheckingDb(true);

    const timeout = setTimeout(async () => {
        const dupes = await checkDbDuplicates(urls);
        setDbDuplicates(dupes);
        setCheckingDb(false);
    }, 400);

    return () => clearTimeout(timeout);
    }, [text]);

  async function checkDbDuplicates(urls: string[]) {
    const res = await fetch(`${API_BASE}/content/check-duplicates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });

    if (!res.ok) return new Set<string>();

    const data = await res.json();
    return new Set<string>(data.existing);
  }

  // -----------------------------
  // Submit
  // -----------------------------
  async function handleSubmit() {
    if (validUrls.length === 0 || invalidCount > 0) return;

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
      console.log("Submitting items:", items);

      const res = await fetch(`${API_BASE}/content/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        setResult("❌ Failed to add items");
        return;
      }

      const data = await res.json();
      setResult(`✅ Added ${data.created} items`);

      // reset
      setText("");
      setDbDuplicates(new Set());
      // setSelectedTagIds(new Set());
      setSelectedTagIds([]);
    } catch {
      setResult("❌ Request failed");
    } finally {
      setLoading(false);
    }
  }
  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }


  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2>Bulk URL Intake</h2>

      {/* Shared metadata */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <input
          placeholder="Site"
          value={site}
          onChange={(e) => setSite(e.target.value)}
          style={{ flex: 1 }}
        />
        <input
          placeholder="Creator"
          value={creator}
          onChange={(e) => setCreator(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
      </div>

      {/* URL editor */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "24px 1fr 180px",
          border: "2px solid #fff",
          borderRadius: 6,
          background: "#3a3a3a",
          color: "#fff",
          fontFamily: "monospace",
          maxHeight: 300,
          overflow: "auto",
        }}
      >
        {/* Left */}
        <div>
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                height: LINE_HEIGHT,
                lineHeight: `${LINE_HEIGHT}px`,
                textAlign: "center",
                color:
                    l.status === "ok" && !l.reason
                        ? "#4caf50"
                        : l.status === "duplicate-db"
                        ? "#ffb300"
                        : l.status === "error"
                        ? "#e53935"
                        : "#999",

              }}
            >
              {l.reason === "Checking…" ? "…" :
                l.status === "ok" ? "✔" :
                l.status === "duplicate-db" ? "⚠" :
                l.status === "error" ? "✖" : ""}

            </div>
          ))}
        </div>

        {/* Middle */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          style={{
            border: "none",
            outline: "none",
            resize: "none",
            padding: "0px 10px",
            background: "transparent",
            color: "#fff",
            width: "100%",
            minHeight: 300,
            lineHeight: `${LINE_HEIGHT}px`,
            fontSize: 14,
          }}
        />

        {/* Right */}
        <div style={{ padding: "0px 8px" }}>
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                height: LINE_HEIGHT,
                lineHeight: `${LINE_HEIGHT}px`,
                fontSize: 12,
                color: "#e57373",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {l.reason || ""}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {lines.length > 0 && (
        <div style={{ fontSize: 13, marginTop: 8 }}>
          Valid: {validUrls.length} &nbsp;|&nbsp; Invalid: {invalidCount}
        </div>
      )}

      {tagsError && <div style={{ color: "red" }}>{tagsError}</div>}

        <BulkTagSelector
        groups={tagGroups}
        loading={tagsLoading}
        selectedTagIds={selectedTagIds}
        onToggleTag={toggleTag}
        onCreateTag={async (groupId, label) => {
            await ensureTag(groupId, label);
            reloadTags();
        }}
        />



      <button
        onClick={handleSubmit}
        disabled={loading || validUrls.length === 0 || invalidCount > 0}
        style={{
          marginTop: 16,
          padding: "10px 14px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Adding…" : "Add URLs"}
      </button>

      {result && (
        <div style={{ marginTop: 12, fontSize: 14 }}>{result}</div>
      )}
    </div>
  );
}
