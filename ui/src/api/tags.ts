const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export interface Tag {
  id: string;
  label: string;
}

export async function searchTags(
  group: string,
  q: string
): Promise<Tag[]> {
  const res = await fetch(
    `${API_BASE}/tags/search?group=${group}&q=${encodeURIComponent(q)}`
  );
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function ensureTag(group: string, label: string): Promise<Tag> {
  const res = await fetch(`${API_BASE}/tags/ensure`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group_id: group, label }),
  });
  if (!res.ok) throw new Error("Ensure failed");
  return res.json();
}

export async function assignTags(
  contentId: string,
  tagIds: string[]
) {
  const res = await fetch(`${API_BASE}/tags/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content_id: contentId,
      tag_ids: tagIds,
    }),
  });
  if (!res.ok) throw new Error("Assign failed");
}

export async function unassignTags(
  contentId: string,
  tagIds: string[]
) {
  const res = await fetch(`${API_BASE}/tags/unassign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content_id: contentId,
      tag_ids: tagIds,
    }),
  });

  if (!res.ok) {
    throw new Error("Unassign failed");
  }

  return res.json();
}
