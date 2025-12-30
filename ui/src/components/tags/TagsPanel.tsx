import BulkTagSelector from "./BulkTagSelector";
import "./tags-panel.css";

type Props = {
  groups: any[];
  loading: boolean;
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: (groupId: string, label: string) => Promise<void>;
  blockedGroupIds?: Set<string>;
};

export default function TagsPanel({
  groups,
  loading,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  blockedGroupIds
}: Props) {
  const blocked = blockedGroupIds ?? new Set<string>();

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

      <BulkTagSelector
        groups={groups}
        loading={loading}
        selectedTagIds={selectedTagIds}
        onToggleTag={onToggleTag}
        onCreateTag={onCreateTag}
        blockedGroupIds={blocked}
      />
    </section>
  );
}
