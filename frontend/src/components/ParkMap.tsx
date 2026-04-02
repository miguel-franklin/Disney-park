import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Attraction, ParkMapDefinition } from "../types/attraction";
import { AttractionMarker } from "./AttractionMarker";

interface ParkMapProps {
  park: ParkMapDefinition;
  attractions: Attraction[];
  activeAttractionId: string | null;
  onSelectAttraction: (attraction: Attraction) => void;
  isCoordinateEditEnabled: boolean;
  onToggleCoordinateEdit: () => void | Promise<void>;
  onAttractionCoordinateChange: (attractionId: string, x: number, y: number) => void;
  coordinateSaveStatus: string | null;
}

export function ParkMap({
  park,
  attractions,
  activeAttractionId,
  onSelectAttraction,
  isCoordinateEditEnabled,
  onAttractionCoordinateChange,
  coordinateSaveStatus
}: ParkMapProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [markersVisible, setMarkersVisible] = useState(true);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(park.floors?.[0]?.id ?? null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setSelectedFloorId(park.floors?.[0]?.id ?? null);
  }, [park.id, park.floors]);

  const activeMapPath = useMemo(() => {
    if (!park.floors?.length || !selectedFloorId) {
      return park.mapImagePath;
    }
    return park.floors.find((floor) => floor.id === selectedFloorId)?.mapImagePath ?? park.mapImagePath;
  }, [park.floors, park.mapImagePath, selectedFloorId]);

  const visibleAttractions = useMemo(() => {
    if (!park.floors?.length || !selectedFloorId) {
      return attractions;
    }
    return attractions.filter((attraction) => attraction.floorId === selectedFloorId);
  }, [attractions, park.floors, selectedFloorId]);

  const mapStyle = useMemo(
    () => ({
      transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`
    }),
    [offset.x, offset.y, zoom]
  );

  const fitMapToViewport = useCallback(() => {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!viewport || !image || !image.naturalWidth || !image.naturalHeight) {
      return;
    }

    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;
    if (!viewportWidth || !viewportHeight) {
      return;
    }

    const imageHeightAtZoomOne = viewportWidth * (image.naturalHeight / image.naturalWidth);
    const fitZoom = Math.min(1, viewportHeight / imageHeightAtZoomOne);
    const centeredX = (viewportWidth - viewportWidth * fitZoom) / 2;
    const centeredY = (viewportHeight - imageHeightAtZoomOne * fitZoom) / 2;

    setZoom(Number(fitZoom.toFixed(2)));
    setOffset({ x: Number(centeredX.toFixed(2)), y: Number(centeredY.toFixed(2)) });
  }, []);

  useEffect(() => {
    const handleResize = () => fitMapToViewport();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fitMapToViewport]);

  useEffect(() => {
    // Re-fit after controls/layout updates that can alter viewport height.
    const id = window.setTimeout(() => fitMapToViewport(), 0);
    return () => window.clearTimeout(id);
  }, [fitMapToViewport, selectedFloorId, park.id, attractions.length]);

  const resetView = () => fitMapToViewport();

  return (
    <section className="park-map-section">
      <header className="park-map-section__header">
        <h1>{park.label} Explorer</h1>
        <div className="park-map-section__actions">
          <span>{park.floors?.length ? `${visibleAttractions.length} on this floor` : `${attractions.length} attractions`}</span>
          <button type="button" onClick={() => setMarkersVisible((current) => !current)}>
            {markersVisible ? "Hide markers" : "Show markers"}
          </button>
          <button type="button" onClick={resetView}>
            Reset view
          </button>
        </div>
      </header>

      {park.floors?.length ? (
        <div className="park-map-section__floors" role="tablist" aria-label={`${park.label} floor selector`}>
          {park.floors.map((floor) => (
            <button
              key={floor.id}
              type="button"
              role="tab"
              aria-selected={selectedFloorId === floor.id}
              className={`park-map-section__floor-button ${selectedFloorId === floor.id ? "is-active" : ""}`}
              onClick={() => {
                setSelectedFloorId(floor.id);
                resetView();
              }}
            >
              {floor.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        ref={viewportRef}
        className="park-map-viewport park-map-viewport--static"
      >
        <div className="park-map-canvas" style={mapStyle}>
          <div className="park-map-stack">
            <img
              ref={imageRef}
              src={activeMapPath}
              alt={`${park.label} guide map`}
              className="park-map-image"
              draggable={false}
              onLoad={fitMapToViewport}
            />
            {markersVisible ? (
              <div className="park-map-markers">
                {visibleAttractions.map((attraction) => (
                  <AttractionMarker
                    key={attraction.id}
                    attraction={attraction}
                    isActive={activeAttractionId === attraction.id}
                    onSelect={onSelectAttraction}
                    isCoordinateEditEnabled={isCoordinateEditEnabled}
                    onCoordinateChange={onAttractionCoordinateChange}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
