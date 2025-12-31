import { useState } from "react";
import type { TagGroup } from "../../types/tags";
import TagPill from "./TagPill";
import "./tag-theme.css";

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
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const sortedTags = [...group.tags].sort(
    (a, b) => b.usage_count - a.usage_count
  );

  const visibleTags = expanded
    ? sortedTags
    : sortedTags.slice(0, COLLAPSED_LIMIT);

  const selectedCount = group.tags.filter(t =>
    selectedTagIds.includes(t.id)
  ).length;

  const totalCount = group.tags.length;

  function submit() {
    if (!newLabel.trim() || !onCreateTag) return;
    onCreateTag(newLabel.trim());
    setNewLabel("");
    setAdding(false);
  }

  return (
    <div >
      {/* LEFT */}
      <div>
        <div className="tag-group-title">
          {group.id}

          <span className="tag-count">
            {selectedCount > 0 && (
              <span className="selected">{selectedCount}</span>
            )}
            <span className="total">/ {totalCount}</span>
          </span>
        </div>


        <div className="tag-pills">
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
      <div className="tag-actions">
        {onCreateTag && (
          <>
            {!adding ? (
              <button
                className="tag-action-btn"
                onClick={() => setAdding(true)}
              >
                + New tag
              </button>
            ) : (
              <input
                autoFocus
                className="tag-input"
                value={newLabel}
                placeholder="New tag…"
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setNewLabel("");
                  }
                }}
              />
            )}
          </>
        )}

        {sortedTags.length > COLLAPSED_LIMIT && (
          <button
            className="tag-expand"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Show less ▲" : "Show more ▼"}
          </button>
        )}
      </div>
    </div>
  );
}
