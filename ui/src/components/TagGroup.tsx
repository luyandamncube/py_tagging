import { useEffect, useState, useMemo } from "react";
import { searchTags, ensureTag, assignTags, unassignTags } from "../api/tags";
import type { Tag } from "../api/tags";

interface Props {
  contentId: string;
  groupId: string;
  title: string;
  description?: string;
  min?: number;
  max?: number | null;
  required?: boolean;
  initialTags: Tag[];
}

export default function TagGroup({
  contentId,
  groupId,
  title,
  description,
  min = 0,
  max = null,
  required = false,
  initialTags,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<Tag[]>(initialTags);

  // ----------------------------------
  // Keep local state in sync with props
  // ----------------------------------
  useEffect(() => {
    setSelected(initialTags);
  }, [initialTags]);

  // ----------------------------------
  // Build fast lookup of selected tags
  // ----------------------------------
  const selectedIds = useMemo(
    () => new Set(selected.map((t) => t.id)),
    [selected]
  );

  // ----------------------------------
  // Compute counters & validation state
  // ----------------------------------
  const count = selected.length;
  const maxReached = max !== null && count >= max;

  let status: "ok" | "missing" | "over" = "ok";

  if (count < min) {
    status = "missing";
  } else if (max !== null && count > max) {
    status = "over";
  }

  // ----------------------------------
  // Fetch autocomplete results
  // ----------------------------------
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    searchTags(groupId, query)
      .then(setResults)
      .catch(console.error);
  }, [groupId, query]);

  // ----------------------------------
  // Add tag (existing or new)
  // ----------------------------------
    async function handleAdd(label: string, tag?: Tag) {
    if (maxReached) return;

    let finalTag = tag;

    if (!finalTag) {
        finalTag = await ensureTag(groupId, label);
    }

    if (selectedIds.has(finalTag.id)) {
        return;
    }

    await assignTags(contentId, [finalTag.id]);

    setSelected((prev) => [...prev, finalTag]);
    setQuery("");
    setResults([]);
    }

    async function handleRemove(tag: Tag) {
    try {
        await unassignTags(contentId, [tag.id]);

        setSelected((prev) =>
        prev.filter((t) => t.id !== tag.id)
        );
    } catch (err) {
        console.error("Failed to remove tag", err);
    }
    }



  return (
    <div style={{ marginBottom: 20 }}>
      {/* Title + counter */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <strong>{title}</strong>

        <span
          style={{
            fontSize: 12,
            padding: "2px 6px",
            borderRadius: 8,
            background:
              status === "ok"
                ? "#e6fffa"
                : status === "missing"
                ? "#fff4e5"
                : "#ffe6e6",
            color:
              status === "ok"
                ? "#065f46"
                : status === "missing"
                ? "#92400e"
                : "#991b1b",
          }}
        >
          {count} / {max === null ? "∞" : max}
          {status === "ok" && " ✓"}
          {status === "missing" && required && " ⚠️"}
          {status === "over" && " ❌"}
        </span>
      </div>

      {description && (
        <div style={{ fontSize: 12, color: "#666" }}>{description}</div>
      )}

        {/* Selected tags */}
        <div style={{ marginTop: 8 }}>
        {selected.map((t) => (
            <span
            key={t.id}
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 8px",
                margin: 4,
                background: "#eee",
                borderRadius: 12,
                fontSize: 13,
            }}
            >
            {t.label}

            <button
                onClick={() => handleRemove(t)}
                style={{
                marginLeft: 6,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
                opacity: 0.6,
                }}
                title="Remove tag"
            >
                ×
            </button>
            </span>
        ))}
        </div>


      {/* Input */}
        <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={
            maxReached
            ? "Maximum reached"
            : `Add ${title.toLowerCase()}…`
        }
        disabled={maxReached}
        style={{
            width: "100%",
            marginTop: 8,
            background: maxReached ? "#f5f5f5" : undefined,
            cursor: maxReached ? "not-allowed" : undefined,
        }}
        />


      {/* Suggestions */}
      {query && !maxReached && (
        <div style={{ border: "1px solid #ccc", marginTop: 4 }}>
          {results
            .filter((t) => !selectedIds.has(t.id))
            .map((t) => (
              <div
                key={t.id}
                style={{ padding: 6, cursor: "pointer" }}
                onClick={() => handleAdd(t.label, t)}
              >
                {t.label}
              </div>
            ))}

          {results.filter((t) => !selectedIds.has(t.id)).length === 0 && (
            <div
              style={{ padding: 6, cursor: "pointer", fontStyle: "italic" }}
              onClick={() => handleAdd(query)}
            >
              ➕ Create “{query}”
            </div>
          )}
        </div>
      )}
    </div>
  );
}
