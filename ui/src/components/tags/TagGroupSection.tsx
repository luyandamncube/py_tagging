import { useState, useEffect } from "react";
import type { TagGroup } from "../../types/tags";
import TagPill from "./TagPill";
import "./tag-theme.css";

const COLLAPSED_LIMIT = 6;

export default function TagGroupSection({
  group,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [autoExpanded, setAutoExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const sortedTags = [...group.tags].sort(
    (a, b) => b.usage_count - a.usage_count
  );

  const selectedCount = group.tags.filter(t =>
    selectedTagIds.includes(t.id)
  ).length;

  useEffect(() => {
    if (!autoExpanded && selectedCount > 0) {
      setExpanded(true);
      setAutoExpanded(true);
    }
  }, [selectedCount, autoExpanded]);

  function submit() {
    if (!newLabel.trim() || !onCreateTag) return;
    onCreateTag(newLabel.trim());
    setNewLabel("");
    setAdding(false);
  }

  return (
    <div
      className={`tag-group ${expanded ? "expanded" : ""} ${selectedCount > 0 ? "has-selected" : ""}`}
    >
      <div
        className="tag-group-title"
        onClick={() => setExpanded(v => !v)}
      >
        <span>{group.label ?? group.id}</span>

        <span className="tag-count">
          <span className={`selected ${selectedCount === 0 ? "empty" : ""}`}>
            {selectedCount}
          </span>
          <span className="total">/ {group.tags.length}</span>
        </span>
      </div>

      {expanded && (
        <div className="tag-pills">
          {sortedTags.map(tag => (
            <TagPill
              key={tag.id}
              tag={tag}
              selected={selectedTagIds.includes(tag.id)}
              onToggle={() => onToggleTag(tag.id)}
            />
          ))}
        </div>
      )}

      {!expanded && selectedCount > 0 && (
        <div className="tag-pills condensed">
          {sortedTags
            .filter(t => selectedTagIds.includes(t.id))
            .slice(0, COLLAPSED_LIMIT)
            .map(tag => (
              <TagPill
                key={tag.id}
                tag={tag}
                selected
                onToggle={() => onToggleTag(tag.id)}
              />
            ))}
        </div>
      )}

      {expanded && onCreateTag && (
        <div className="tag-actions">
          {!adding ? (
            <button
              className="tag-action-btn subtle"
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
        </div>
      )}
    </div>
  );
}
