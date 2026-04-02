import { useRef } from "react";
import type { Attraction } from "../types/attraction";

interface AttractionMarkerProps {
  attraction: Attraction;
  isActive: boolean;
  onSelect: (attraction: Attraction) => void;
  isCoordinateEditEnabled: boolean;
  onCoordinateChange: (attractionId: string, x: number, y: number) => void;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function AttractionMarker({
  attraction,
  isActive,
  onSelect,
  isCoordinateEditEnabled,
  onCoordinateChange
}: AttractionMarkerProps) {
  const isDraggingRef = useRef(false);

  const updateFromPointer = (clientX: number, clientY: number, marker: HTMLButtonElement) => {
    const mapStack = marker.closest(".park-map-stack");
    if (!(mapStack instanceof HTMLElement)) {
      return;
    }
    const rect = mapStack.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    const x = clampPercent(((clientX - rect.left) / rect.width) * 100);
    const y = clampPercent(((clientY - rect.top) / rect.height) * 100);
    onCoordinateChange(attraction.id, Number(x.toFixed(2)), Number(y.toFixed(2)));
  };

  return (
    <button
      type="button"
      className={`attraction-marker ${isActive ? "is-active" : ""} ${isCoordinateEditEnabled ? "is-editing" : ""}`}
      style={{ left: `${attraction.x}%`, top: `${attraction.y}%` }}
      onClick={() => {
        if (!isCoordinateEditEnabled) {
          onSelect(attraction);
        }
      }}
      onPointerDown={(event) => {
        if (!isCoordinateEditEnabled) {
          return;
        }
        isDraggingRef.current = true;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event.clientX, event.clientY, event.currentTarget);
      }}
      onPointerMove={(event) => {
        if (!isCoordinateEditEnabled || !isDraggingRef.current) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        updateFromPointer(event.clientX, event.clientY, event.currentTarget);
      }}
      onPointerUp={(event) => {
        if (!isCoordinateEditEnabled) {
          return;
        }
        isDraggingRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={(event) => {
        if (!isCoordinateEditEnabled) {
          return;
        }
        isDraggingRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      title={attraction.name}
      aria-label={`Open details for ${attraction.name}`}
    >
      <span className="attraction-marker__dot">{attraction.guideMapNumber}</span>
    </button>
  );
}
