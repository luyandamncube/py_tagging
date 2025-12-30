import { useState } from "react";
import "./masonry.css";

type ContentItem = {
  id?: string;
  url: string;
  type: "image" | "video";
  site?: string;
  creator?: string;
  tags?: {
    id: string;
    label: string;
    usage_count?: number;
  }[];
};

type Props = {
  items: ContentItem[];
};

function getTopTags(
  tags: ContentItem["tags"],
  limit = 3
) {
  if (!tags || tags.length === 0) return [];

  const sorted = [...tags].sort(
    (a, b) => (b.usage_count ?? 0) - (a.usage_count ?? 0)
  );

  return sorted.slice(0, limit);
}

function MasonryItem({ item }: { item: ContentItem }) {
  const [error, setError] = useState(false);

  return (
    <div className="masonry-item">
      {!error ? (
        item.type === "image" ? (
          <img
            src={item.url}
            alt=""
            loading="lazy"
            onError={() => setError(true)}
          />
        ) : (
          <video
            src={item.url}
            muted
            playsInline
            onError={() => setError(true)}
          />
        )
      ) : (
        <div className="image-fallback">
          <span>⚠️ Media unavailable</span>
        </div>
      )}

      <div className="overlay">
        <div className="overlay-top">
          <button className="overlay-btn">View</button>
        </div>

        <div className="overlay-bottom">
          {getTopTags(item.tags).length > 0 ? (
            getTopTags(item.tags).map((tag) => (
              <span key={tag.id} className="tag-pill">
                {tag.label}
              </span>
            ))
          ) : (
            <span className="tag-pill muted">No tags</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MasonryGrid({ items }: Props) {
  return (
    <div className="masonry-grid">
      {items.map((item, index) => (
        <MasonryItem
          key={item.id ?? `content-${index}`}
          item={item}
        />
      ))}
    </div>
  );
}
