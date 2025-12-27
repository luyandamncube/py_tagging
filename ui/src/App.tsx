import "./App.css";

import ContentPreview from "./components/ContentPreview";
import TagGroupSection from "./components/TagGroupSection";
import ValidationBanner from "./components/ValidationBanner";
import TagGroup from "./components/TagGroup";

import { useTagGroups } from "./hooks/useTagGroups";
import { useLatestContent } from "./hooks/useLatestContent";

function App() {
  // -----------------------------
  // Load tag groups
  // -----------------------------
  const {
    groups,
    loading: groupsLoading,
    error: groupsError,
  } = useTagGroups();

  // -----------------------------
  // Load latest content snapshot
  // -----------------------------
  const {
    snapshot,
    loading: contentLoading,
  } = useLatestContent();

  const loading = groupsLoading || contentLoading;

  if (loading) {
    return <p style={{ padding: 20 }}>Loading…</p>;
  }

  if (groupsError) {
    return <p style={{ color: "red" }}>{groupsError}</p>;
  }

  if (!snapshot) {
    return <p>No content found. Create content first.</p>;
  }

  // ✅ content is defined HERE (and only here)
  const { content, tags: assignedTags } = snapshot;

  const required = groups.filter((g) => g.required);
  const optional = groups.filter((g) => !g.required);

  return (
    <div className="app">
      {/* Left: content preview */}
      <div className="left">
        {/* ✅ Safe to reference content now */}
        <div style={{ fontSize: 12, opacity: 0.6 }}>
          Content ID: {content.id}
        </div>

        <ContentPreview content={content} />
      </div>

      {/* Right: tagging UI */}
      <div className="right">
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

        <ValidationBanner contentId={content.id} />
      </div>
    </div>
  );
}

export default App;
