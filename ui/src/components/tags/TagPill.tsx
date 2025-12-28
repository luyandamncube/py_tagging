import type { Tag } from "../../types/tags";

type Props = {
  tag: Tag;
  selected: boolean;
  onToggle: () => void;
};

export default function TagPill({ tag, selected, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: "10px 18px",
        borderRadius: 14,
        border: "none",
        background: selected ? "#5aa0e6" : "#b7d4f1",
        color: selected ? "#fff" : "#1f4f82",
        fontSize: 18,
        fontWeight: 500,
        cursor: "pointer",
        // transition: "all 0.15s ease",
        transition: "max-height 0.2s ease",
      }}
    >
      {tag.label}
    </button>
  );
}

