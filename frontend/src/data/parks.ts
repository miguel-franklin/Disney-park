import disneylandParkAttractions from "./parks/disneylandPark.json";
import waltDisneyStudiosParkAttractions from "./parks/waltDisneyStudiosPark.json";
import type { Attraction, ParkMapDefinition, ParkId } from "../types/attraction";

/**
 * Map rasters under `public/maps/`. Use a Disneyland *Paris* guide (PDF export or PNG/JPEG).
 * When you have the official Paris PDF, save it as `disneyland-paris.pdf` (or replace `disneyland.pdf`)
 * and re-run `tools/extract_pdf_maps.py`, then fix page order here if needed.
 */
export const parks: ParkMapDefinition[] = [
  {
    id: "disneyland-park",
    label: "Disneyland Park (Paris)",
    mapImagePath: "/maps/disneyland-paris-park.jpg"
  },
  {
    id: "walt-disney-studios-park",
    label: "Disney Adventure World (Paris)",
    mapImagePath: "/maps/disney-adventure-world.png"
  }
];

const byParkId: Record<ParkId, Attraction[]> = {
  "disneyland-park": disneylandParkAttractions as Attraction[],
  "walt-disney-studios-park": waltDisneyStudiosParkAttractions as Attraction[]
};

export const attractionsByPark = byParkId;
