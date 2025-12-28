import { useState } from "react";
import type { TagGroup } from "../../types/tags";
import TagPill from "./TagPill";

const COLLAPSED_LIMIT = 6;

type Props = {
  group: TagGroup;
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag?: (label: string) => void;
};

export default function TagGroupSection({
  group,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);      // ✅ ADD
  const [newLabel, setNewLabel] = useState("");     // ✅ ADD

  const sortedTags = [...group.tags].sort(
    (a, b) => b.usage_count - a.usage_count
  );

  const visibleTags = expanded
    ? sortedTags
    : sortedTags.slice(0, COLLAPSED_LIMIT);

  function submit() {
    if (!newLabel.trim() || !onCreateTag) return;
    onCreateTag(newLabel.trim());
    setNewLabel("");
    setAdding(false);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 240px",
        gap: 24,
        padding: 20,
        borderRadius: 14,
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        marginBottom: 20,
      }}
    >
      {/* LEFT */}
      <div>
        <h2
          style={{
            margin: "0 0 14px",
            fontSize: 26,
            fontWeight: 700,
            color: "#2e2e2e",
          }}
        >
          {group.id}
        </h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {visibleTags.map((tag) => (
            <TagPill
              key={tag.id}
              tag={tag}
              selected={selectedTagIds.includes(tag.id)}
              onToggle={() => onToggleTag(tag.id)}
            />
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 12,
        }}
      >
        {onCreateTag && (
          <>
            {!adding ? (
              <button
                onClick={() => setAdding(true)}     // ✅ FIX
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: "#d9d9d9",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Add new tag <span style={{ fontSize: 20 }}>＋</span>
              </button>
            ) : (
              <input
                autoFocus
                value={newLabel}
                placeholder="New tag…"
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();   // ✅ stop browser jump
                    submit();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setAdding(false);
                    setNewLabel("");
                  }
                }}

                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #ccc",
                  fontSize: 14,
                }}
              />
            )}
          </>
        )}

        {sortedTags.length > COLLAPSED_LIMIT && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              background: "none",
              border: "none",
              color: "#999",
              cursor: "pointer",
              fontSize: 14,
              opacity: 1,
            }}
          >
            {expanded ? "Show less ▲" : "Show more ▼"}
          </button>
        )}
      </div>
    </div>
  );
}
