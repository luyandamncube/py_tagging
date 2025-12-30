import "./tag-filter-bar.css";

type Tag = {
  id: string;
  label: string;
  count: number;
};

type Props = {
  tags: Tag[];
  selected: Set<string>;
  onToggle: (tagId: string) => void;
};

export default function TagFilterBar({ tags, selected, onToggle }: Props) {
  return (
    <div className="tag-filter-bar">
      {tags.map((tag) => (
        <button
          key={tag.id}
          className={`tag-filter-pill ${
            selected.has(tag.id) ? "active" : ""
          }`}
          onClick={() => onToggle(tag.id)}
        >
          {tag.label}
          <span className="count">{tag.count}</span>
        </button>
      ))}
    </div>
  );
}
