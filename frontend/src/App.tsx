import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { ParkSelector } from "./components/ParkSelector";
import { ParkMap } from "./components/ParkMap";
import { AttractionPopup } from "./components/AttractionPopup";
import { AttractionFilters, type AttractionFilterState } from "./components/AttractionFilters";
import { attractionsByPark, parks } from "./data/parks";
import type { Attraction, ParkId } from "./types/attraction";

const INITIAL_FILTERS: AttractionFilterState = {
  query: "",
  types: [],
  thrills: [],
  audiences: [],
  environment: "all",
  maxMinHeightCm: null
};

export default function App() {
  const [parkId, setParkId] = useState<ParkId>("disneyland-park");
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [isCoordinateEditEnabled, setIsCoordinateEditEnabled] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [filtersByPark, setFiltersByPark] = useState<Record<ParkId, AttractionFilterState>>({
    "disneyland-park": INITIAL_FILTERS,
    "walt-disney-studios-park": INITIAL_FILTERS
  });
  const [attractionsStateByPark, setAttractionsStateByPark] = useState<Record<ParkId, Attraction[]>>(
    JSON.parse(JSON.stringify(attractionsByPark)) as Record<ParkId, Attraction[]>
  );

  const park = useMemo(() => parks.find((entry) => entry.id === parkId) ?? parks[0], [parkId]);
  const attractions = attractionsStateByPark[parkId] ?? [];
  const activeFilters = filtersByPark[parkId] ?? INITIAL_FILTERS;
  const filteredAttractions = useMemo(() => {
    return attractions.filter((attraction) => {
      const { metadata } = attraction;
      const query = activeFilters.query.trim().toLowerCase();
      if (query) {
        const haystack = `${attraction.name} ${attraction.land} ${attraction.description}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      if (activeFilters.types.length && !activeFilters.types.includes(metadata.attractionType)) {
        return false;
      }
      if (activeFilters.thrills.length && !activeFilters.thrills.includes(metadata.thrillLevel)) {
        return false;
      }
      if (
        activeFilters.audiences.length &&
        !activeFilters.audiences.some((audience) => metadata.targetAudience.includes(audience))
      ) {
        return false;
      }
      if (activeFilters.environment === "indoor" && !metadata.indoor) {
        return false;
      }
      if (activeFilters.environment === "outdoor" && metadata.indoor) {
        return false;
      }
      if (activeFilters.maxMinHeightCm !== null && metadata.minHeightCm !== null && metadata.minHeightCm > activeFilters.maxMinHeightCm) {
        return false;
      }
      return true;
    });
  }, [activeFilters, attractions]);

  const updateAttractionCoordinate = (targetParkId: ParkId, attractionId: string, x: number, y: number) => {
    setAttractionsStateByPark((current) => {
      const list = current[targetParkId] ?? [];
      return {
        ...current,
        [targetParkId]: list.map((item) => (item.id === attractionId ? { ...item, x, y } : item))
      };
    });
  };

  const saveCoordinatesForPark = async (targetParkId: ParkId) => {
    const list = attractionsStateByPark[targetParkId] ?? [];
    const payload = {
      parkId: targetParkId,
      coordinates: list.map(({ id, x, y }) => ({ id, x, y }))
    };

    const response = await fetch("/__save-coordinates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = (await response.json()) as { ok?: boolean; error?: string; filePath?: string };
    if (!response.ok || !result.ok) {
      throw new Error(result.error ?? "Unable to save coordinates");
    }
    return result.filePath;
  };

  const handleToggleCoordinateEdit = async () => {
    if (!isCoordinateEditEnabled) {
      setIsCoordinateEditEnabled(true);
      setSaveStatus("Coordinate edit mode enabled. Drag markers, then click Save Coordinates.");
      return;
    }

    setSaveStatus("Saving coordinates...");
    try {
      const filePath = await saveCoordinatesForPark(parkId);
      setIsCoordinateEditEnabled(false);
      setSaveStatus(`Coordinates saved to ${filePath}.`);
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : "Failed to save coordinates.");
    }
  };

  useEffect(() => {
    setSelectedAttraction(null);
    setIsCoordinateEditEnabled(false);
    setSaveStatus(null);
  }, [parkId]);

  useEffect(() => {
    if (!selectedAttraction) {
      return;
    }
    const stillVisible = filteredAttractions.some((attraction) => attraction.id === selectedAttraction.id);
    if (!stillVisible) {
      setSelectedAttraction(null);
    }
  }, [filteredAttractions, selectedAttraction]);

  if (!park) {
    return <p>Park configuration not found.</p>;
  }

  return (
    <main className="app">
      <ParkSelector parks={parks} selectedParkId={parkId} onParkChange={setParkId} />
      <div className="app__content">
        <div className="app__map-column">
          <AttractionFilters
            attractions={attractions}
            value={activeFilters}
            filteredCount={filteredAttractions.length}
            onChange={(next) => setFiltersByPark((current) => ({ ...current, [parkId]: next }))}
            onReset={() => setFiltersByPark((current) => ({ ...current, [parkId]: INITIAL_FILTERS }))}
          />
          <ParkMap
            park={park}
            attractions={filteredAttractions}
            activeAttractionId={selectedAttraction?.id ?? null}
            onSelectAttraction={setSelectedAttraction}
            isCoordinateEditEnabled={isCoordinateEditEnabled}
            onToggleCoordinateEdit={handleToggleCoordinateEdit}
            onAttractionCoordinateChange={(attractionId, x, y) => updateAttractionCoordinate(parkId, attractionId, x, y)}
            coordinateSaveStatus={saveStatus}
          />
        </div>
        {selectedAttraction ? (
          <AttractionPopup attraction={selectedAttraction} onClose={() => setSelectedAttraction(null)} />
        ) : (
          <aside className="attraction-placeholder">
            <h2>Select an attraction</h2>
            <p>Click any marker on the map to open details, photos, and visitor metadata.</p>
          </aside>
        )}
      </div>
    </main>
  );
}
