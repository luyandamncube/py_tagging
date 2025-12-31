import { useEffect, useState } from "react"
import { getNextContent, getContentSnapshot } from "../api/content"
import type { ContentSnapshot, Content } from "../types/content"

export function useNextContentSnapshot() {
  const [snapshot, setSnapshot] = useState<ContentSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        // Step 1: get next content stub
        const next: Content | null = await getNextContent()

        if (!next) {
          if (!cancelled) setSnapshot(null)
          return
        }

        // Step 2: fetch full snapshot
        const full = await getContentSnapshot(next.id)

        if (!cancelled) {
          setSnapshot(full)
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load next content")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    snapshot,
    loading,
    error,
  }
}
