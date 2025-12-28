import { useEffect, useState, useCallback } from "react";
import type { TagGroup } from "../types/tags";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";

export function useTagGroupsWithTags() {
  const [groups, setGroups] = useState<TagGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/tag-groups/with-tags`, {
        credentials: "include", // safe default, helps if auth added later
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: TagGroup[] = await res.json();

      // Defensive: ensure tags array always exists
      const normalized = data.map(g => ({
        ...g,
        tags: g.tags ?? [],
      }));

      setGroups(normalized);
    } catch (err) {
      console.error("useTagGroupsWithTags failed:", err);
      setError("Could not load tag groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    groups,
    loading,
    error,
    reload: load, // 🔁 call after ensureTag / create-tag
  };
}
