import { useEffect, useState } from "react";
import { fetchContentSnapshot,  } from "../api/content";
import type {ContentSnapshot} from "../api/content";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export function useLatestContent() {
  const [snapshot, setSnapshot] = useState<ContentSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${API_BASE}/debug/content`);
      const rows = await res.json();
      if (!rows.length) return;

      const latestId = rows[rows.length - 1][0];
      const snap = await fetchContentSnapshot(latestId);
      setSnapshot(snap);
      setLoading(false);
    }

    load().catch(console.error);
  }, []);

  return { snapshot, loading };
}
