import { useState } from "react";
import type { ContentPreview } from "../types/content";

interface Props {
  preview?: ContentPreview;
  className?: string;
}

export default function ContentPreviewView({
  preview,
  className,
}: Props) {
  const [failed, setFailed] = useState(false);

  const status = preview?.status ?? "pending";

  // If failed ONCE → never attempt again
  if (status === "failed" || failed) {
    return (
      <div className={`${className} masonry-media fallback`}>
        <span>⚠️ Preview unavailable</span>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className={`${className} masonry-media skeleton`} />
    );
  }

  const src =
    preview?.url_normalized ??
    preview?.url ??
    null;

  // Guard: no src → fallback
  if (!src) {
    return (
      <div className={`${className} masonry-media fallback`}>
        <span>⚠️ Preview unavailable</span>
      </div>
    );
  }

  return (
    <div className={`${className} masonry-media`}>
      <img
        src={src}
        alt={preview?.title ?? "Content preview"}
        loading="lazy"
        onError={(e) => {
          // IMPORTANT: stop further loading attempts
          e.currentTarget.onerror = null;
          setFailed(true);
        }}
      />
    </div>
  );
}
