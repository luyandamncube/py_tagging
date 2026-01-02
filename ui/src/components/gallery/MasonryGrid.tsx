import "./masonry.css";
import type { Content } from "../../types/content";
import ContentPreviewView from "../ContentPreview";
import { Link } from "react-router-dom";
/**
 * Extract top N tags by usage_count (unchanged)
 */
function getTopTags(tags: Content["tags"], limit = 3) {
  if (!tags || tags.length === 0) return [];

  const sorted = [...tags].sort(
    (a, b) => (b.usage_count ?? 0) - (a.usage_count ?? 0)
  );

  return sorted.slice(0, limit);
}

/* -----------------------------------------
   MasonryItem
----------------------------------------- */
function MasonryItem({
  item,
  onTagClick,
  onOpen,
}: {
  item: Content;
  onTagClick?: (tagId: string) => void;
  onOpen?: (item: Content) => void;
}) {
  return (
    <div className="masonry-item">
      {/* Media preview */}
      <div
        className="masonry-media-wrapper"
        // onClick={() => onOpen?.(item)}
        onClick={() => {
          console.log("MEDIA CLICKED", item.id);
          onOpen?.(item);
        }}
      >
        <ContentPreviewView
          preview={item.preview}
          className="masonry-media"
          disableInteraction
        />
      </div>


      {/* Overlay */}
      <div className="overlay">
        <div className="overlay-top">
          <Link
            to={`/review/${item.id}`}
            className="overlay-btn"
          >
            Review
          </Link>
        </div>


        <div className="overlay-bottom">
          {getTopTags(item.tags).length > 0 ? (
            getTopTags(item.tags).map((tag) => (
              <button
                key={tag.id}
                className="tag-pill clickable"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTagClick?.(tag.id);
                }}
              >
                {tag.label}
              </button>
            ))
          ) : (
            <span className="tag-pill muted">No tags</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------
   MasonryGrid
----------------------------------------- */
type Props = {
  items: Content[];
  onTagClick?: (tagId: string) => void;
  onOpen?: (item: Content) => void;

};

export default function MasonryGrid({ items, onTagClick }: Props) {
  return (
    <div className="masonry-grid">
      {items.map((item) => (
        <MasonryItem
          key={item.id}
          item={item}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  );
}
