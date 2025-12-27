const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export interface ContentTag {
  id: string;
  label: string;
  group_id: string;
}

export interface ContentSnapshot {
  content: {
    id: string;
    url: string;
    site?: string;
    creator?: string;
    type?: string;
  };
  tags: Record<string, ContentTag[]>;
}

export async function fetchContentSnapshot(
  contentId: string
): Promise<ContentSnapshot> {
  const res = await fetch(`${API_BASE}/content/${contentId}`);
  if (!res.ok) throw new Error("Failed to load content");
  return res.json();
}
