import { useEffect, useState } from "react";
import { fetchTagGroups } from "../api/tagGroups";
import type { TagGroup } from "../api/tagGroups";

export function useTagGroups() {
  const [groups, setGroups] = useState<TagGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTagGroups()
      .then((data) => {
        // ensure stable order
        const sorted = [...data].sort((a, b) => a.position - b.position);
        setGroups(sorted);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { groups, loading, error };
}
