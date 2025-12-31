import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import TagsPanel from "../components/tags/TagsPanel";
import { useTagGroupsWithTags } from "../hooks/useTagGroupsWithTags";
import { ensureTag } from "../api/tags";
import ValidationPanel from "../components/validation/ValidationPanel";
import ContentPreviewView from "../components/ContentPreview";
import "./review.css";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";

type ReviewItem = {
  id: string;
  url: string;
  type: "image" | "video";
  site?: string;
  creator?: string;
  tags?: { id: string }[];
  preview?: any; // ← ADD THIS
};

type LayoutContext = {
  setRightPanel: (node: React.ReactNode) => void;
};

export default function ReviewPage() {
  const { setRightPanel } = useOutletContext<LayoutContext>();

  const [item, setItem] = useState<ReviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [validationLoading, setValidationLoading] = useState(false);
  const [validationIssues, setValidationIssues] = useState<any[]>([]);

  const { contentId } = useParams<{ contentId?: string }>();

  const hasBlockingErrors = validationIssues.some(
    (issue) => issue.level === "error"
  );
  const blockingGroupIds = new Set(
    validationIssues
      .filter((issue) => issue.level === "error")
      .map((issue: any) => issue.groupId)
  );

  const {
    groups: tagGroups,
    loading: tagsLoading,
    reload: reloadTags,
  } = useTagGroupsWithTags();

  // --------------------------------------------------
  // Load next item
  // --------------------------------------------------

  // async function loadNext() {
  //   setLoading(true);

  //   try {
  //     const res = await fetch(`${API_BASE}/content/next`);
  //     if (!res.ok) {
  //       setItem(null);
  //       return;
  //     }

  //     const data = await res.json();
  //     setItem(data);
  //     setSelectedTagIds(data.tags?.map((t: any) => t.id) || []);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  async function loadItem() {
    setLoading(true);

    try {
      let res;

      if (contentId) {
        // DIRECT MODE
        res = await fetch(`${API_BASE}/content/${contentId}`);
      } else {
        // QUEUE MODE
        res = await fetch(`${API_BASE}/content/next`);
      }

      if (!res.ok) {
        setItem(null);
        return;
      }

      const data = await res.json();

      if (data.content) {
        // Snapshot shape
        setItem({
          ...data.content,
          preview: data.preview, // ← IMPORTANT
          tags: data.tags,        // grouped tags (used elsewhere)
        });
        setSelectedTagIds(extractTagIds(data));
      } else {
        // Queue shape
        setItem(data);
        setSelectedTagIds(extractTagIds(data));
      }

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItem();
  }, []);

  // --------------------------------------------------
  // Tag handlers (per-item)
  // --------------------------------------------------

  async function toggleTag(tagId: string) {
    if (!item) return;

    const isSelected = selectedTagIds.includes(tagId);

    setSelectedTagIds((prev) =>
      isSelected
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );

    await fetch(`${API_BASE}/tags/${isSelected ? "unassign" : "assign"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_id: item.id,
        tag_ids: [tagId],
      }),
    });

    // re-run validation after tag change
    await loadValidation(item.id);
  }

  const handleCreateTag = async (groupId: string, label: string) => {
    await ensureTag(groupId, label);
    reloadTags();
  };

  // --------------------------------------------------
  // Validation fetch
  // --------------------------------------------------

  async function loadValidation(contentId: string) {
    setValidationLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/content/${contentId}/validation`
      );

      if (!res.ok) {
        setValidationIssues([]);
        return;
      }

      const data = await res.json();

      const issues =
        data.groups
          ?.filter((g: any) => g.status !== "ok")
          .map((g: any) => {
            let level: "warning" | "error" = "warning";

            if (g.status === "over_limit") {
              level = "error";
            }

            if (g.status === "missing" && g.min > 0) {
              level = "error";
            }

            return {
              level,
              groupId: g.id,
              message:
                g.status === "missing"
                  ? `Missing tags for "${g.id}" (min ${g.min})`
                  : g.status === "over_limit"
                    ? `Too many tags for "${g.id}" (max ${g.max})`
                    : `Issue in "${g.id}"`,
            };
          }) || [];

      setValidationIssues(issues);
    } finally {
      setValidationLoading(false);
    }
  }


  useEffect(() => {
    if (item?.id) {
      loadValidation(item.id);
    }
  }, [item?.id]);

  // --------------------------------------------------
  // Validation panel
  // --------------------------------------------------
  useEffect(() => {
    setRightPanel(
      <>
        <ValidationPanel
          loading={validationLoading}
          issues={validationIssues}
        />
        <TagsPanel
          groups={tagGroups}
          loading={tagsLoading}
          selectedTagIds={selectedTagIds}
          onToggleTag={toggleTag}
          onCreateTag={handleCreateTag}
          blockedGroupIds={blockingGroupIds}
        />

      </>
    );
  }, [
    setRightPanel,
    validationLoading,
    validationIssues,
    tagGroups,
    tagsLoading,
    selectedTagIds,
  ]);


  // --------------------------------------------------
  // Complete item
  // --------------------------------------------------

  async function completeAndNext() {
    if (!item || hasBlockingErrors) return;

    setCompleting(true);
    await fetch(`${API_BASE}/content/${item.id}/complete`, {
      method: "POST",
    });

    if (contentId) {
      // If reviewing a specific item, go back to queue
      window.location.href = "/review";
    } else {
      // Queue mode → continue
      await loadItem();
    }

    setCompleting(false);
  }

  function extractTagIds(data: any): string[] {
    // Snapshot shape: { tags: { groupId: [{ id }] } }
    if (data?.tags && !Array.isArray(data.tags)) {
      return Object.values(data.tags)
        .flat()
        .map((t: any) => t.id);
    }

    // Flat shape: { tags: [{ id }] }
    if (Array.isArray(data?.tags)) {
      return data.tags.map((t: any) => t.id);
    }

    return [];
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  if (loading) {
    return <div className="page">Loading next item…</div>;
  }

  if (!item) {
    return <div className="page">No content to review 🎉</div>;
  }
  return (
    <div className="page">
      {/* <header className="page-header">
        <h1>Review</h1>
        <p>Review and tag the next item</p>
      </header> */}

      {/* 🔽 Everything scrollable lives here */}
      <div className="page-content">
        {/* Media */}
        <section className="card">
          <ContentPreviewView
            preview={item.preview}
            className="review-media"
          />
        </section>



        {/* Validation */}
        {/* <section className="card">
          <ValidationPanel
            loading={validationLoading}
            issues={validationIssues}
          />
        </section> */}

        {/* ✅ Mobile-only tags MUST be inside page-content */}
        <section className="card tags-inline">
          <TagsPanel
            groups={tagGroups}
            loading={tagsLoading}
            selectedTagIds={selectedTagIds}
            onToggleTag={toggleTag}
            onCreateTag={handleCreateTag}
            blockedGroupIds={blockingGroupIds}
          />
        </section>
      </div>

      {/* Footer stays fixed */}
      <footer className="page-actions">
                {/* Metadata */}
        <section className="card">
          <div><strong>Site:</strong> {item.site || "—"}</div>
          <div><strong>Creator:</strong> {item.creator || "—"}</div>
          <div><strong>ID:</strong> {item.id}</div>
        </section>
        <button
          className={`primary ${hasBlockingErrors ? "disabled" : ""}`}
          onClick={completeAndNext}
          disabled={completing || hasBlockingErrors}
          title={
            hasBlockingErrors
              ? "Resolve validation errors before completing"
              : undefined
          }
        >
          {hasBlockingErrors
            ? "Fix validation issues"
            : completing
              ? "Completing…"
              : "Complete & Next"}
        </button>
      </footer>
    </div>
  );

}

