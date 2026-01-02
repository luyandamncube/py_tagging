import TagsPanel from "./TagsPanel";
import { useTagGroupsWithTags } from "../../hooks/useTagGroupsWithTags";
import { ensureTag } from "../../api/tags";
import { useContentValidation } from "../../hooks/useContentValidation";

type Props = {
  contentId?: string;               // ✅ optional for bulk mode
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
};

export default function TagsPanelShell({
  contentId,
  selectedTagIds,
  onToggleTag,
}: Props) {
  const {
    groups,
    loading,
    error,
    reload,
  } = useTagGroupsWithTags();

  const { validation } = useContentValidation(contentId);

  const handleCreateTag = async (groupId: string, label: string) => {
    await ensureTag(groupId, label);
    reload();
  };

  if (error) {
    return <div className="error">Failed to load tags</div>;
  }

  return (
    <TagsPanel
      groups={groups}
      loading={loading}
      validation={validation}
      selectedTagIds={selectedTagIds}
      onToggleTag={onToggleTag}
      onCreateTag={handleCreateTag}
      tagsOpen={true}
      setTagsOpen={() => {}}
    />
  );
}
