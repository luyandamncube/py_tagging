import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import MasonryGrid from "../components/gallery/MasonryGrid";
import TagFilterBar from "../components/filters/TagFilterBar";
import ContentCarousel from "../components/carousel/ContentCarousel";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";

type ContentItem = {
  id: string;
  url: string;
  type: "image" | "video";
  created_at?: string;
  tags?: {
    id: string;
    label: string;
    group_id?: string;
    usage_count?: number;
  }[];
};

type LayoutContext = {
  setRightPanel: (node: React.ReactNode | null) => void;
};

export default function ContentPage() {
  const { setRightPanel } = useOutletContext<LayoutContext>();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  // const [carouselItem, setCarouselItem] = useState<any | null>(null);
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);


  const [selectedContentIds, setSelectedContentIds] = useState<Set<string>>(
    new Set()
  );


  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  function exportUrls(
    urls: string[],
    filename: string
  ) {
    if (!urls.length) return;

    const blob = new Blob([urls.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  function exportFiltered() {
    exportUrls(
      filteredItems.map((i) => i.url),
      "filtered-content-urls.txt"
    );
  }

  function exportSelected() {
    const urls = filteredItems
      .filter((i) => selectedContentIds.has(i.id))
      .map((i) => i.url);

    exportUrls(urls, "selected-content-urls.txt");
  }

  function openCarousel(item: ContentItem) {
    const index = filteredItems.findIndex((i) => i.id === item.id);
    if (index === -1) return;

    setCarouselIndex(index);
    document.body.style.overflow = "hidden";
  }


  function closeCarousel() {
    setCarouselIndex(null);
    document.body.style.overflow = "";
  }
  function showPrev() {
    setCarouselIndex((i) => {
      if (i === null) return i;
      return i === 0 ? filteredItems.length - 1 : i - 1;
    });
  }

  function showNext() {
    setCarouselIndex((i) => {
      if (i === null) return i;
      return i === filteredItems.length - 1 ? 0 : i + 1;
    });
  }


  function selectAllFiltered() {
    setSelectedContentIds(
      new Set(filteredItems.map((item) => item.id))
    );
  }
  function clearSelection() {
    setSelectedContentIds(new Set());
  }

  // Disable right panel
  useEffect(() => {
    setRightPanel(null);
  }, [setRightPanel]);

  // Load content
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/debug/content`);
        const data = await res.json();
        setItems(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Compute tag popularity
  const tagStats = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();

    items.forEach((item) => {
      item.tags?.forEach((tag) => {
        const entry = map.get(tag.id);
        if (!entry) {
          map.set(tag.id, {
            id: tag.id,
            label: tag.label ?? tag.id,
            count: 1,
          });
        } else {
          entry.count += 1;
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (selectedTags.size === 0) return items;
    return items.filter((item) =>
      item.tags?.some((t) => selectedTags.has(t.id))
    );
  }, [items, selectedTags]);

  function toggleFilter(tagId: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(tagId) ? next.delete(tagId) : next.add(tagId);
      return next;
    });
  }

  function handleGridTagClick(tagId: string) {
    setSelectedTags((prev) => {
      if (prev.has(tagId)) return prev; // already active → no-op
      const next = new Set(prev);
      next.add(tagId);
      return next;
    });
  }

  if (loading) {
    return <div className="page">Loading content…</div>;
  }
  const hasMultiple = filteredItems.length > 1;
  return (
    <>


      <div className="page">
        <div className="content-header">
          <div className="content-actions">
            <button
              className="action-btn"
              disabled={filteredItems.length === 0}
              onClick={selectAllFiltered}
            >
              Select all filtered ({filteredItems.length})
            </button>

            <button
              className="action-btn"
              disabled={selectedContentIds.size === 0}
              onClick={clearSelection}
            >
              Clear selection
            </button>

            <button
              className="export-btn"
              disabled={filteredItems.length === 0}
              onClick={exportFiltered}
            >
              Export filtered ({filteredItems.length})
            </button>

            <button
              className="export-btn"
              disabled={selectedContentIds.size === 0}
              onClick={exportSelected}
            >
              Export selected ({selectedContentIds.size})
            </button>
          </div>



          <TagFilterBar
            tags={tagStats}
            selected={selectedTags}
            onToggle={toggleFilter}
          />

        </div>
        {/* <MasonryGrid
          items={filteredItems}
          onTagClick={handleGridTagClick}
          onOpen={openCarousel}
        /> */}
        <MasonryGrid
          items={filteredItems}
          selectedIds={selectedContentIds}
          onToggleSelect={(contentId) => {
            setSelectedContentIds((prev) => {
              const next = new Set(prev);
              next.has(contentId) ? next.delete(contentId) : next.add(contentId);
              return next;
            });
          }}
          onOpen={openCarousel}
        />


      </div>

      {carouselIndex !== null && filteredItems[carouselIndex] && (
        <ContentCarousel
          item={filteredItems[carouselIndex]}
          index={carouselIndex}
          total={filteredItems.length}
          onClose={closeCarousel}
          onPrev={showPrev}
          onNext={showNext}
          hasPrev={filteredItems.length > 1}
          hasNext={filteredItems.length > 1}
        />



      )}

    </>
  );

}
