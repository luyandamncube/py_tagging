import { createPortal } from "react-dom";
import ContentPreviewView from "../ContentPreview";
import "./carousel.css";

type Props = {
  item: any;
  onClose: () => void;
};

export default function ContentCarousel({ item, onClose }: Props) {
  if (!item) return null;

  return createPortal(
    <div className="carousel-backdrop" onClick={onClose}>
      <div
        className="carousel-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="carousel-close" onClick={onClose}>
          ✕
        </button>

        <div className="carousel-content">
          <ContentPreviewView
            preview={item.preview}
            className="carousel-media"
            disableInteraction
          />
        </div>

        <div className="carousel-meta">
          <div><strong>Site:</strong> {item.site || "—"}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
