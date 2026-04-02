import { useState } from "react";
import type { Attraction, AttractionType, ThrillLevel } from "../types/attraction";

export interface AttractionFilterState {
  query: string;
  types: AttractionType[];
  thrills: ThrillLevel[];
  audiences: Array<"toddlers" | "kids" | "family" | "teens" | "adults">;
  environment: "all" | "indoor" | "outdoor";
  maxMinHeightCm: number | null;
}

interface AttractionFiltersProps {
  attractions: Attraction[];
  value: AttractionFilterState;
  onChange: (next: AttractionFilterState) => void;
  onReset: () => void;
  filteredCount: number;
}

const ALL_TYPES: AttractionType[] = ["ride", "show", "character", "dining", "transport", "walkthrough", "play-area", "service"];
const ALL_THRILLS: ThrillLevel[] = ["low", "moderate", "high"];
const ALL_AUDIENCES: Array<"toddlers" | "kids" | "family" | "teens" | "adults"> = [
  "toddlers",
  "kids",
  "family",
  "teens",
  "adults"
];

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export function AttractionFilters({ attractions, value, onChange, onReset, filteredCount }: AttractionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="attraction-filters" aria-label="Attraction filters">
      <div className="attraction-filters__header">
        <button
          type="button"
          className="attraction-filters__accordion-toggle"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? "Hide Filters" : "Show Filters"}
        </button>
        <button type="button" onClick={onReset} disabled={!isOpen}>
          Reset
        </button>
      </div>

      {isOpen ? (
        <div className="attraction-filters__body">
          <label className="attraction-filters__search">
            <span>Search</span>
            <input
              type="text"
              value={value.query}
              onChange={(event) => onChange({ ...value, query: event.target.value })}
              placeholder="Name, land, description..."
            />
          </label>

          <fieldset className="attraction-filters__group">
            <legend>Type</legend>
            <div className="attraction-filters__chips">
              {ALL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={value.types.includes(type) ? "is-active" : ""}
                  onClick={() => onChange({ ...value, types: toggleInList(value.types, type) })}
                >
                  {type}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="attraction-filters__group">
            <legend>Thrill</legend>
            <div className="attraction-filters__chips">
              {ALL_THRILLS.map((thrill) => (
                <button
                  key={thrill}
                  type="button"
                  className={value.thrills.includes(thrill) ? "is-active" : ""}
                  onClick={() => onChange({ ...value, thrills: toggleInList(value.thrills, thrill) })}
                >
                  {thrill}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="attraction-filters__group">
            <legend>Audience</legend>
            <div className="attraction-filters__chips">
              {ALL_AUDIENCES.map((audience) => (
                <button
                  key={audience}
                  type="button"
                  className={value.audiences.includes(audience) ? "is-active" : ""}
                  onClick={() => onChange({ ...value, audiences: toggleInList(value.audiences, audience) })}
                >
                  {audience}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="attraction-filters__group">
            <legend>Environment</legend>
            <div className="attraction-filters__row">
              <label>
                <input
                  type="radio"
                  name="environment"
                  checked={value.environment === "all"}
                  onChange={() => onChange({ ...value, environment: "all" })}
                />
                All
              </label>
              <label>
                <input
                  type="radio"
                  name="environment"
                  checked={value.environment === "indoor"}
                  onChange={() => onChange({ ...value, environment: "indoor" })}
                />
                Indoor
              </label>
              <label>
                <input
                  type="radio"
                  name="environment"
                  checked={value.environment === "outdoor"}
                  onChange={() => onChange({ ...value, environment: "outdoor" })}
                />
                Outdoor
              </label>
            </div>
          </fieldset>

          <label className="attraction-filters__search">
            <span>Max minimum height (cm)</span>
            <input
              type="number"
              min={0}
              max={200}
              step={1}
              value={value.maxMinHeightCm ?? ""}
              placeholder="e.g. 102"
              onChange={(event) =>
                onChange({
                  ...value,
                  maxMinHeightCm: event.target.value ? Number(event.target.value) : null
                })
              }
            />
          </label>
        </div>
      ) : null}

      <p className="attraction-filters__result">Showing {filteredCount} of {attractions.length}</p>
    </section>
  );
}
