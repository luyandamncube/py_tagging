import type { TagGroup } from "../../types/tags";
import TagGroupSection from "./TagGroupSection";

type Props = {
  groups: TagGroup[];
  loading?: boolean;
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag?: (groupId: string, label: string) => Promise<void> | void;
  blockedGroupIds?: Set<string>;

  // ✅ controlled accordion state
  // tagsOpen: boolean;
  // setTagsOpen: (v: boolean) => void;
};

export default function BulkTagSelector({
  groups,
  loading = false,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  blockedGroupIds,
  // tagsOpen,
  // setTagsOpen,
}: Props) {
  const blocked = blockedGroupIds ?? new Set<string>();

  if (loading) {
    return <div style={{ padding: 12, opacity: 0.7 }}>Loading tag groups…</div>;
  }

  if (!groups || groups.length === 0) {
    return <div style={{ padding: 12, opacity: 0.6 }}>No tag groups available</div>;
  }

  return (
    <div >
      {/* <button
        className="tag-action-btn"
        onClick={() => setTagsOpen(!tagsOpen)}
      >
        {tagsOpen ? "Hide tags" : "Add tags"}
      </button> */}

        <div style={{ marginTop: 16 }}>
          {groups.map((group) => {
            const isBlocked = blocked.has(group.id);

            return (
              // <div
              //   key={group.id}
              //   className={`tag-group ${isBlocked ? "blocked" : ""}`}
              // >
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
              // </div>
            );
          })}
        </div>
    </div>
  );
}
