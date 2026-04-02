export type ParkId = "disneyland-park" | "walt-disney-studios-park";

export interface AttractionMedia {
  imageUrls: string[];
  youtubeVideoUrl: string;
}

export type AttractionType =
  | "ride"
  | "show"
  | "character"
  | "dining"
  | "transport"
  | "walkthrough"
  | "play-area"
  | "service";

export type ThrillLevel = "low" | "moderate" | "high";

export interface AttractionMetadata {
  attractionType: AttractionType;
  thrillLevel: ThrillLevel;
  targetAudience: Array<"toddlers" | "kids" | "family" | "teens" | "adults">;
  /** Minimum rider height in centimeters, when a restriction exists. */
  minHeightCm: number | null;
  /** Optional solo-driving threshold (e.g. Autopia). */
  minHeightSoloCm: number | null;
  indoor: boolean;
  /** Query-friendly facets for future filtering/search. */
  tags: string[];
}

export interface Attraction {
  id: string;
  parkId: ParkId;
  name: string;
  land: string;
  description: string;
  /** 0–100, horizontal position on the guide map image (matches official map numbering placement). */
  x: number;
  /** 0–100, vertical position (top = 0). */
  y: number;
  /** Optional: printed attraction number on the official Disneyland Paris guidemap. */
  guideMapNumber?: number;
  /** Optional level/floor identifier for multi-floor maps (e.g. museums). */
  floorId?: string;
  media: AttractionMedia;
  metadata: AttractionMetadata;
}

export interface FloorMapDefinition {
  id: string;
  label: string;
  mapImagePath: string;
}

export interface ParkMapDefinition {
  id: ParkId;
  label: string;
  /** Public URL path to a raster map (e.g. exported from `tools/extract_pdf_maps.py`). */
  mapImagePath: string;
  /** Optional per-floor maps (for venues like Louvre). */
  floors?: FloorMapDefinition[];
}
