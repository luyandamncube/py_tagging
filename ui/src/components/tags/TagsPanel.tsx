import { useMemo } from "react";
import BulkTagSelector from "./BulkTagSelector";
import "./tags-panel.css";

import type { TagGroup } from "../../types/tags";
import type {
  ContentValidation,
  GroupValidation,
} from "../../hooks/useContentValidation";

type Props = {
  groups: TagGroup[];
  loading: boolean;
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: (groupId: string, label: string) => Promise<void>;
  blockedGroupIds?: Set<string>;

  // ✅ validation from content/{id}/validation
  validation: ContentValidation | null;

  // ✅ controlled accordion state
  // tagsOpen: boolean;
  // setTagsOpen: (v: boolean) => void;
};

export default function TagsPanel({
  groups,
  loading,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  blockedGroupIds,
  validation,
  // tagsOpen,
  // setTagsOpen,
}: Props) {
  const blocked = blockedGroupIds ?? new Set<string>();

  // --------------------------------------------------
  // Map validation → group_id
  // --------------------------------------------------
  const validationByGroup = useMemo(() => {
    const map = new Map<string, GroupValidation>();
    validation?.groups.forEach((g) => {
      map.set(g.group_id, g);
    });
    return map;
  }, [validation]);

  if (loading) {
    return <div className="tags-loading">Loading tags…</div>;
  }

  return (
    <section className="tags-panel">
      <div className="tags-panel-header">
        <span>Tags</span>
        <span className="tags-panel-hint">
          Applied to all valid URLs
        </span>
      </div>

      <input
        className="tag-search"
        placeholder="Search tags or groups…"
      />

      <BulkTagSelector
        groups={groups}
        loading={loading}
        selectedTagIds={selectedTagIds}
        onToggleTag={onToggleTag}
        onCreateTag={onCreateTag}
        blockedGroupIds={blocked}
        validationByGroup={validationByGroup}
        // tagsOpen={tagsOpen}
        // setTagsOpen={setTagsOpen}
      />
    </section>
  );
}
