

import { createPortal } from "react-dom";
import { useEffect } from "react";
import ContentPreviewView from "../ContentPreview";
import "./carousel.css";

type Props = {
  item: any;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
};



export default function ContentCarousel({
  item,
  index,
  total,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasPrev, hasNext, onPrev, onNext, onClose]);

  return createPortal(
    <div className="carousel-backdrop" onClick={onClose}>
      <div
        className="carousel-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="carousel-close" onClick={onClose}>
          ✕
        </button>

        <div className="carousel-index">
          {index + 1} / {total}
        </div>


        {hasPrev && (
          <button className="carousel-nav prev" onClick={onPrev}>
            ‹
          </button>
        )}

        {hasNext && (
          <button className="carousel-nav next" onClick={onNext}>
            ›
          </button>
        )}

        <div className="carousel-content">
          <ContentPreviewView
            preview={item.preview}
            className="carousel-media"
            disableInteraction
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
