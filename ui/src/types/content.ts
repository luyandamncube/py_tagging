// ui/src/types/content.ts

/**
 * Preview lifecycle states returned by the API
 */
export type PreviewStatus = "pending" | "ready" | "failed"

/**
 * Preview payload (lightweight in lists, rich in detail views)
 */
export interface ContentPreview {
  status: PreviewStatus

  // URLs
  url?: string | null
  url_normalized?: string | null

  // Present in detail view
  type?: "image" | "video" | "page" | "unknown"
  title?: string | null
  description?: string | null
  fetched_at?: string
}

/**
 * Core content entity (used in lists and detail views)
 */
export interface Content {
  id: string
  url: string

  site?: string | null
  creator?: string | null
  type: string
  status: string
  created_at: string

  // Derived preview info
  preview?: ContentPreview

  // Tags (flat in lists, grouped in detail views)
  tags?: {
    id: string
    label: string
    group_id?: string
  }[]
}

/**
 * Full content snapshot (GET /content/{id})
 */
export interface ContentSnapshot {
  content: Content
  preview: ContentPreview
  tags: Record<
    string,
    {
      id: string
      label: string
    }[]
  >
  validation: {
    valid: boolean
    completion_pct: number
    missing_required_groups: string[]
    summary: {
      missing_required: number
      over_limit: number
    }
  }
}
