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
  const [carouselItem, setCarouselItem] = useState<any | null>(null);

function openCarousel(item: any) {
  console.log("OPEN CAROUSEL", item.id);
  setCarouselItem(item);
  document.body.style.overflow = "hidden";
}


  function closeCarousel() {
    setCarouselItem(null);
    document.body.style.overflow = "";
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

  return (
  <>
    <div className="page">
      <TagFilterBar
        tags={tagStats}
        selected={selectedTags}
        onToggle={toggleFilter}
      />

      <MasonryGrid
        items={filteredItems}
        onTagClick={handleGridTagClick}
        onOpen={openCarousel}
      />
    </div>

    {carouselItem && (
      <ContentCarousel
        item={carouselItem}
        onClose={closeCarousel}
      />
    )}
  </>
);

}
