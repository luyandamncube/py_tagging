import { useState } from "react";
import type { TagGroup } from "../../types/tags";
import TagPill from "./TagPill";

interface Props {
  group: TagGroup;
  selectedTagIds: Set<string>;
  onToggleTag: (tagId: string) => void;
  onCreateTag: (groupId: string) => void;
}

const COLLAPSED_COUNT = 6;

export default function BulkTagGroup({
  group,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const sortedTags = [...group.tags].sort(
    (a, b) => b.usage_count - a.usage_count
  );

  const visibleTags = expanded
    ? sortedTags
    : sortedTags.slice(0, COLLAPSED_COUNT);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Group header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <strong>{group.id}</strong>

        <button
          onClick={() => onCreateTag(group.id)}
          style={{
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          ➕ Add
        </button>
      </div>

      {/* Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {visibleTags.map(tag => (
         <TagPill
            key={tag.id}
            tag={tag}
            selected={selectedTagIds.has(tag.id)}
            onToggle={() => onToggleTag(tag.id)}
            />

        ))}
      </div>

      {/* Show more */}
      {sortedTags.length > COLLAPSED_COUNT && (
        <div style={{ marginTop: 6, textAlign: "right" }}>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ fontSize: 12 }}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>
      )}
    </div>
  );
}
