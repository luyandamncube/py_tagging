import { useMemo, useState } from "react";
import { createContent } from "../api/content";

interface Props {
  onCreated: () => void;
}

function guessSite(rawUrl: string) {
  try {
    const withScheme = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    const u = new URL(withScheme);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default function UrlInput({ onCreated }: Props) {
  const [url, setUrl] = useState("");
  const [site, setSite] = useState("");
  const [creator, setCreator] = useState("");
  const [type, setType] = useState<"image" | "video">("image");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedSite = useMemo(() => guessSite(url), [url]);

  async function handleSubmit() {
    const trimmed = url.trim();
    if (!trimmed) return;

    try {
      setLoading(true);
      setError(null);

      await createContent({
        url: trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
        site: (site || suggestedSite || "").trim() || "unknown",
        creator: creator.trim() || "unknown",
        type,
      });

      setUrl("");
      setSite("");
      setCreator("");
      setType("image");

      onCreated();
    } catch (e: any) {
      setError(e?.message || "Failed to create content");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 700 }}>
      <h2>📥 Add new URL</h2>

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste URL… (example.com/page or https://example.com/page)"
        style={{ width: "100%", padding: 12, fontSize: 16, marginTop: 12 }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
      />

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
            Site {suggestedSite ? `(suggested: ${suggestedSite})` : ""}
          </div>
          <input
            value={site}
            onChange={(e) => setSite(e.target.value)}
            placeholder="e.g. instagram.com"
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
            Creator / channel
          </div>
          <input
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            placeholder="e.g. @creatorname"
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ width: 140 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
            Type
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "image" | "video")}
            style={{ width: "100%", padding: 10 }}
          >
            <option value="image">image</option>
            <option value="video">video</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !url.trim()}
        style={{ marginTop: 14, padding: "10px 14px", fontWeight: 600 }}
      >
        ➕ Add
      </button>

      {error && <div style={{ marginTop: 10, color: "red" }}>{error}</div>}
    </div>
  );
}
