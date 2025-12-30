import { useState } from "react";
import type { TagGroup } from "../../types/tags";
import TagGroupSection from "./TagGroupSection";

type Props = {
  groups: TagGroup[];
  loading?: boolean;
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag?: (groupId: string, label: string) => Promise<void> | void;
  blockedGroupIds?: Set<string>;
};

export default function BulkTagSelector({
  groups,
  loading = false,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  blockedGroupIds,
}: Props) {
  // ✅ SAFE DEFAULT
  const blocked = blockedGroupIds ?? new Set<string>();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ padding: 12, opacity: 0.7 }}>
        Loading tag groups…
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div style={{ padding: 12, opacity: 0.6 }}>
        No tag groups available
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button
        className="tag-action-btn"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide tags" : "Add tags"}
      </button>

      {open && (
        <div style={{ marginTop: 16 }}>
          {groups.map((group) => {
            const isBlocked = blocked.has(group.id);

            return (
              <div
                key={group.id}
                className={`tag-group ${isBlocked ? "blocked" : ""}`}
              >
                <TagGroupSection
                  group={group}
                  selectedTagIds={selectedTagIds}
                  onToggleTag={onToggleTag}
                  onCreateTag={
                    onCreateTag
                      ? (label: string) => onCreateTag(group.id, label)
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
