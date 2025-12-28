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

/* ----------------------------------
   Existing (keep this)
---------------------------------- */
export async function fetchContentSnapshot(
  contentId: string
): Promise<ContentSnapshot> {
  const res = await fetch(`${API_BASE}/content/${contentId}`);
  if (!res.ok) throw new Error("Failed to load content");
  return res.json();
}

/* ----------------------------------
   NEW: get next content ID
---------------------------------- */
export async function fetchNextContentId(): Promise<string | null> {
  const res = await fetch(`${API_BASE}/content/next`);
  if (!res.ok) throw new Error("Failed to fetch next content");

  const data = await res.json();
  if (!data) return null;

  return data.id;
}

/* ----------------------------------
   NEW: mark content complete
---------------------------------- */
export async function completeContent(contentId: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/content/${contentId}/complete`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Failed to complete content");
}

export async function createContent(payload: {
  url: string;
  site?: string;
  creator?: string;
  type?: string;
}) {
  const res = await fetch(`${API_BASE}/content/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to create content");
  }

  return res.json();
}