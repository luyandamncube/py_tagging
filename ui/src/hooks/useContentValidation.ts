import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

interface ValidationResult {
  valid: boolean;
  summary: {
    missing_required: number;
    over_limit: number;
  };
}

export function useContentValidation(contentId: string | null) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contentId) {
      setValidation(null);
      return;
    }

    setLoading(true);

    fetch(`${API_BASE}/content/${contentId}/validation`)
      .then((res) => res.json())
      .then((data) => {
        setValidation(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [contentId]);

  return {
    validation,
    loading,
  };
}

