// ui/src/api/content.ts

import { apiFetch } from "./index"
import type {
  Content,
  ContentSnapshot,
} from "../types/content"

/**
 * List content snapshots (GET /content)
 */
export async function listContent(): Promise<Content[]> {
  return apiFetch<Content[]>("/content")
}

/**
 * Get full content snapshot (GET /content/{id})
 */
export async function getContentSnapshot(
  contentId: string
): Promise<ContentSnapshot> {
  return apiFetch<ContentSnapshot>(`/content/${contentId}`)
}

/**
 * Get next uncompleted content (GET /content/next)
 */
export async function getNextContent(): Promise<Content | null> {
  return apiFetch<Content | null>("/content/next")
}

/**
 * Mark content as complete (POST /content/{id}/complete)
 */
export async function completeContent(
  contentId: string
): Promise<{
  status: "ok"
  content_id: string
}> {
  return apiFetch(`/content/${contentId}/complete`, {
    method: "POST",
  })
}

/**
 * Bulk create content (POST /content/bulk)
 */
export interface BulkCreateResult {
  created: number
  skipped: number
  skipped_urls: string[]
  backup: {
    scheduled: boolean
    snapshot: string | null
    last_sync: unknown
  }
}

export async function bulkCreateContent(
  items: unknown[]
): Promise<BulkCreateResult> {
  return apiFetch<BulkCreateResult>("/content/bulk", {
    method: "POST",
    body: JSON.stringify({ items }),
  })
}
