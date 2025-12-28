import { useCallback, useEffect, useState } from "react";
import {
  fetchNextContentId,
  fetchContentSnapshot,
  completeContent,
  
} from "../api/content";
import type {ContentSnapshot,} from "../api/content";

export function useNextContentSnapshot() {
  const [snapshot, setSnapshot] = useState<ContentSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const loadNext = useCallback(async () => {
    setLoading(true);

    const nextId = await fetchNextContentId();
    if (!nextId) {
      setSnapshot(null);
      setLoading(false);
      return;
    }

    const snap = await fetchContentSnapshot(nextId);
    setSnapshot(snap);
    setLoading(false);
  }, []);

  const completeAndNext = useCallback(async () => {
    if (!snapshot) return;
    await completeContent(snapshot.content.id);
    await loadNext();
  }, [snapshot, loadNext]);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  return {
    snapshot,
    loading,
    loadNext,
    completeAndNext,
  };
}
