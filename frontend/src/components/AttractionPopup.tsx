import { useMemo, useState } from "react";
import type { Attraction } from "../types/attraction";
import { getYoutubeEmbedUrl, resolvedImageUrls, youtubeSearchUrl } from "../utils/media";

interface AttractionPopupProps {
  attraction: Attraction;
  onClose: () => void;
}

type MetaIconName = "type" | "thrill" | "height" | "audience" | "indoor";

function MetaIcon({ name }: { name: MetaIconName }) {
  const paths = {
    type: "M4 7h16M4 12h10M4 17h7",
    thrill: "M12 3l2.6 5.26L20 9l-4 3.9.94 5.1L12 15.8 7.06 18 8 12.9 4 9l5.4-.74L12 3z",
    height: "M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5",
    audience:
      "M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-8 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm0 2c-2.2 0-4 1.3-4 2.9V19h8v-3.1C12 14.3 10.2 13 8 13zm8-.5c-1.2 0-2.3.3-3.1.9 1 .7 1.6 1.6 1.6 2.6V19H20v-2c0-2.1-1.8-4.5-4-4.5z",
    indoor:
      "M3 11.5 12 4l9 7.5M6.5 10.5V20h11v-9.5M10 20v-5h4v5"
  } as const;

  return (
    <span className="meta-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d={paths[name]} />
      </svg>
    </span>
  );
}

export function AttractionPopup({ attraction, onClose }: AttractionPopupProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const images = useMemo(
    () => resolvedImageUrls(attraction.id, attraction.media.imageUrls),
    [attraction.id, attraction.media.imageUrls]
  );
  const embedUrl = useMemo(
    () => getYoutubeEmbedUrl(attraction.media.youtubeVideoUrl),
    [attraction.media.youtubeVideoUrl]
  );
  const selectedImage = images[selectedImageIndex] ?? images[0];
  const youtubeLink = youtubeSearchUrl(attraction.name);
  const typeLabel = attraction.metadata.attractionType.replace(/-/g, " ");
  const thrillLabel =
    attraction.metadata.thrillLevel.charAt(0).toUpperCase() + attraction.metadata.thrillLevel.slice(1);
  const heightLabel = attraction.metadata.minHeightCm
    ? `${attraction.metadata.minHeightCm} cm`
    : "No minimum";
  const indoorLabel = attraction.metadata.indoor ? "Indoor" : "Outdoor";

  return (
    <aside className="attraction-popup" aria-label={`${attraction.name} details`}>
      <header className="attraction-popup__header">
        <div>
          <p className="attraction-popup__land">{attraction.land}</p>
          <h2>{attraction.name}</h2>
        </div>
        <button type="button" onClick={onClose} className="attraction-popup__close" aria-label="Close attraction details">
          x
        </button>
      </header>

      <section className="attraction-popup__description-block" aria-label="Attraction description">
        <p className="attraction-popup__description">{attraction.description}</p>
      </section>

      <section className="attraction-popup__meta" aria-label="Attraction metadata">
        <article className="attraction-popup__meta-item">
          <MetaIcon name="type" />
          <div>
            <p className="attraction-popup__meta-label">Type</p>
            <p className="attraction-popup__meta-value">{typeLabel}</p>
          </div>
        </article>
        <article className="attraction-popup__meta-item">
          <MetaIcon name="thrill" />
          <div>
            <p className="attraction-popup__meta-label">Thrill</p>
            <p className="attraction-popup__meta-value">{thrillLabel}</p>
          </div>
        </article>
        <article className="attraction-popup__meta-item">
          <MetaIcon name="height" />
          <div>
            <p className="attraction-popup__meta-label">Min Height</p>
            <p className="attraction-popup__meta-value">
              {heightLabel}
              {attraction.metadata.minHeightSoloCm
                ? ` (${attraction.metadata.minHeightSoloCm} cm for solo access)`
                : ""}
            </p>
          </div>
        </article>
        <article className="attraction-popup__meta-item">
          <MetaIcon name="indoor" />
          <div>
            <p className="attraction-popup__meta-label">Environment</p>
            <p className="attraction-popup__meta-value">{indoorLabel}</p>
          </div>
        </article>
        <article className="attraction-popup__meta-item attraction-popup__meta-item--wide">
          <MetaIcon name="audience" />
          <div>
            <p className="attraction-popup__meta-label">Best For</p>
            <div className="attraction-popup__chips" aria-label="Audience categories">
              {attraction.metadata.targetAudience.map((audience) => (
                <span key={`${attraction.id}-${audience}`} className="attraction-popup__chip">
                  {audience}
                </span>
              ))}
            </div>
          </div>
        </article>
      </section>

      {selectedImage ? (
        <img className="attraction-popup__hero" src={selectedImage} alt={`${attraction.name} preview`} loading="lazy" />
      ) : null}

      <div className="attraction-popup__thumbs">
        {images.map((image, index) => (
          <button
            type="button"
            key={`${attraction.id}-image-${index}`}
            className={`attraction-popup__thumb ${index === selectedImageIndex ? "is-active" : ""}`}
            onClick={() => setSelectedImageIndex(index)}
            aria-label={`Show image ${index + 1} for ${attraction.name}`}
          >
            <img src={image} alt={`${attraction.name} thumbnail ${index + 1}`} loading="lazy" />
          </button>
        ))}
      </div>

      <div className="attraction-popup__video">
        {attraction.media.youtubeVideoUrl && embedUrl ? (
          <iframe
            src={embedUrl}
            title={`${attraction.name} video`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : attraction.media.youtubeVideoUrl ? (
          <div className="attraction-popup__video-fallback">
            <p>No embeddable video URL is set for this attraction.</p>
            <a className="attraction-popup__video-link" href={youtubeLink} target="_blank" rel="noreferrer">
              Search videos on YouTube
            </a>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
