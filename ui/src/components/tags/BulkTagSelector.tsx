import { useState } from "react";
import type { TagGroup } from "../../types/tags";
import TagGroupSection from "./TagGroupSection";

type Props = {
  groups: TagGroup[];
  loading?: boolean;
  selectedTagIds: string[]; // ✅ FIXED
  onToggleTag: (tagId: string) => void;
  onCreateTag?: (groupId: string, label: string) => Promise<void> | void;
};

export default function BulkTagSelector({
  groups,
  loading = false,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
}: Props) {

  const [open, setOpen] = useState(false);
  // console.log(
  //   "[BulkTagSelector render]",
  //   "open:",
  //   open,
  //   "groups:",
  //   groups?.length
  // );
  // ✅ loading handled INSIDE component (Fix #3)
  if (loading) {
    return (
      <div style={{ padding: 12, opacity: 0.7 }}>
        Loading tag groups…
      </div>
    );
  }

  // ✅ empty state
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
          {groups.map((group) => (
            <TagGroupSection
              key={group.id}
              group={group}
              selectedTagIds={selectedTagIds}
              onToggleTag={onToggleTag}
              onCreateTag={
                onCreateTag
                  ? (label: string) => onCreateTag(group.id, label)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );

}
