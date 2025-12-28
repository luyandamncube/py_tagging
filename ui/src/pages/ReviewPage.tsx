// src/pages/ReviewPage.tsx
import "../App.css";

import ContentPreview from "../components/ContentPreview";
// import TagGroupSection from "../components/TagGroupSection";
import TagGroupSection from "../components/tags/TagGroupSection";
import ValidationBanner from "../components/ValidationBanner";
import TagGroup from "../components/TagGroup";

import { useTagGroups } from "../hooks/useTagGroups";
import { useNextContentSnapshot } from "../hooks/useNextContentSnapshot";
import { useContentValidation } from "../hooks/useContentValidation";

export default function ReviewPage() {
  // -----------------------------
  // Load tag groups
  // -----------------------------
  const {
    groups,
    loading: groupsLoading,
    error: groupsError,
  } = useTagGroups();

  // -----------------------------
  // Load next content snapshot
  // -----------------------------
  const {
    snapshot,
    loading: contentLoading,
    completeAndNext,
    skip,
  } = useNextContentSnapshot();

  const loading = groupsLoading || contentLoading;

  // -----------------------------
  // Early states (NO hooks below)
  // -----------------------------
  if (loading) {
    return <p style={{ padding: 20 }}>Loading…</p>;
  }

  if (groupsError) {
    return <p style={{ color: "red" }}>{groupsError}</p>;
  }

  if (!snapshot) {
    return <p>No content left to review 🎉</p>;
  }

  // -----------------------------
  // Safe: snapshot exists here
  // -----------------------------
  const { content, tags: assignedTags } = snapshot;

  // -----------------------------
  // Validation
  // -----------------------------
  const {
    validation,
    loading: validationLoading,
  } = useContentValidation(content.id);

  const canComplete =
    !validationLoading && validation?.valid === true;

  // -----------------------------
  // Split groups
  // -----------------------------
  const required = groups.filter((g) => g.required);
  const optional = groups.filter((g) => !g.required);

  return (
    <div className="app">
      {/* Left */}
      <div className="left">
        <div style={{ fontSize: 12, opacity: 0.6 }}>
          Content ID: {content.id}
        </div>

        <ContentPreview content={content} />
      </div>

      {/* Right */}
      <div className="right">
        <ValidationBanner contentId={content.id} />

        <TagGroupSection title="Required">
          {required.map((g) => (
            <TagGroup
              key={g.id}
              contentId={content.id}
              groupId={g.id}
              title={g.id}
              description={g.description}
              min={g.min}
              max={g.max}
              required={g.required}
              initialTags={assignedTags[g.id] || []}
            />
          ))}
        </TagGroupSection>

        <TagGroupSection title="Optional">
          {optional.map((g) => (
            <TagGroup
              key={g.id}
              contentId={content.id}
              groupId={g.id}
              title={g.id}
              description={g.description}
              min={g.min}
              max={g.max}
              required={g.required}
              initialTags={assignedTags[g.id] || []}
            />
          ))}
        </TagGroupSection>

        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <button
            disabled={!canComplete}
            style={{
              padding: "10px 14px",
              fontWeight: 600,
              cursor: canComplete ? "pointer" : "not-allowed",
              opacity: canComplete ? 1 : 0.5,
            }}
            onClick={completeAndNext}
          >
            ✅ Complete & Next
          </button>

          <button
            style={{
              padding: "10px 14px",
              fontWeight: 500,
              cursor: "pointer",
              background: "#f5f5f5",
            }}
            onClick={skip}
          >
            ⏭ Skip
          </button>
        </div>
      </div>
    </div>
  );
}
