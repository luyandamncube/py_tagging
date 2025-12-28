import type { Tag } from "../../types/tags";
import "./tag-theme.css";

type Props = {
  tag: Tag;
  selected: boolean;
  onToggle: () => void;
};

export default function TagPill({ tag, selected, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`tag-pill ${selected ? "selected" : ""}`}
    >
      {tag.label}
    </button>
  );
}
