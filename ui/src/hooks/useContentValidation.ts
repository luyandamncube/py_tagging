import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";

export type GroupValidation = {
  group_id: string;
  min_required: number;
  current: number;
  valid: boolean;
};

export type ContentValidation = {
  valid: boolean;
  groups: GroupValidation[];
};

export function useContentValidation(contentId?: string) {
  const [validation, setValidation] = useState<ContentValidation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contentId) return;

    setLoading(true);

    fetch(`${API_BASE}/content/${contentId}/validation`)
      .then((r) => r.json())
      .then(setValidation)
      .finally(() => setLoading(false));
  }, [contentId]);

  return { validation, loading };
}
