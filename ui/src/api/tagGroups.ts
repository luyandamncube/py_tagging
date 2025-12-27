export interface TagGroup {
  id: string;
  description?: string;
  required: boolean;
  min_count: number;
  max_count: number | null;
  position: number;
}

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function fetchTagGroups(): Promise<TagGroup[]> {
  const res = await fetch(`${API_BASE}/tag-groups`);
  if (!res.ok) {
    throw new Error("Failed to fetch tag groups");
  }
  return res.json();
}
