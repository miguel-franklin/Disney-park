import type { ParkId, ParkMapDefinition } from "../types/attraction";

interface ParkSelectorProps {
  parks: ParkMapDefinition[];
  selectedParkId: ParkId;
  onParkChange: (parkId: ParkId) => void;
}

export function ParkSelector({ parks, selectedParkId, onParkChange }: ParkSelectorProps) {
  return (
    <div className="park-selector" role="tablist" aria-label="Park selection">
      {parks.map((park) => (
        <button
          key={park.id}
          className={`park-selector__button ${selectedParkId === park.id ? "is-active" : ""}`}
          onClick={() => onParkChange(park.id)}
          role="tab"
          aria-selected={selectedParkId === park.id}
        >
          {park.label}
        </button>
      ))}
    </div>
  );
}
