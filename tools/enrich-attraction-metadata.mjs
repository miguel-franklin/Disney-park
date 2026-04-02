import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/mfranklin/Projects/Travel";

const attractionTypeById = {
  // Disneyland Park
  "disneyland-railroad-main-street-station": "transport",
  "horse-drawn-streetcars": "transport",
  "main-street-vehicles": "transport",
  "statue-of-liberty-tableau": "walkthrough",
  "dapper-dans-hair-cuts": "service",
  "phantom-manor": "ride",
  "thunder-mesa-riverboat-landing": "transport",
  "rustler-roundup-shootin-gallery": "ride",
  "big-thunder-mountain": "ride",
  "pocahontas-indian-village": "play-area",
  "the-chaparral-theater": "show",
  "disneyland-railroad-frontierland-depot": "transport",
  "la-cabane-des-robinson": "walkthrough",
  "pirates-beach": "play-area",
  "le-passage-enchante-daladdin": "walkthrough",
  "indiana-jones": "ride",
  "adventure-isle": "walkthrough",
  "pirates-of-the-caribbean": "ride",
  "sleeping-beauty-castle": "walkthrough",
  "dragon-lair": "walkthrough",
  "snow-white": "ride",
  pinocchio: "ride",
  "lancelots-carousel": "ride",
  "peter-pan-flight": "ride",
  "disneyland-railroad-fantasyland-station": "transport",
  "meet-mickey-mouse": "character",
  dumbo: "ride",
  "alice-curious-labyrinth": "walkthrough",
  "mad-hatters-tea-cups": "ride",
  "casey-jr-circus-train": "ride",
  "storybook-land-canal": "ride",
  "its-a-small-world": "ride",
  "princess-pavillion": "character",
  "royal-castle-stage": "show",
  "buzz-lightyear-laser-blast": "ride",
  orbitron: "ride",
  "videopolis-theatre": "show",
  "disneyland-railroad-discoveryland-station": "transport",
  "star-tours": "ride",
  starport: "character",
  "discoveryland-theatre": "show",
  "les-mysteres-du-nautilus": "walkthrough",
  "hyperspace-mountain": "ride",
  autopia: "ride",

  // Disney Adventure World
  ratatouille: "ride",
  "spider-man-web-adventure": "ride",
  "avengers-assemble-flight-force": "ride",
  "tower-of-terror": "ride",
  "cars-road-trip": "ride",
  "rc-racer": "ride",
  "slinky-dog-zigzag-spin": "ride",
  "toy-soldiers-parachute-drop": "ride",
  "mickey-and-the-magician": "show",
  "together-pixar-musical-adventure": "show",
  "bistrot-chez-remy": "dining",
  "marvel-pym-kitchen": "dining",
  "stark-factory-pizza-pasta": "dining"
};

const thrillLevelById = {
  "big-thunder-mountain": "high",
  "indiana-jones": "high",
  "hyperspace-mountain": "high",
  "avengers-assemble-flight-force": "high",
  "rc-racer": "high",
  "tower-of-terror": "high",

  autopia: "moderate",
  "star-tours": "moderate",
  "buzz-lightyear-laser-blast": "moderate",
  "mad-hatters-tea-cups": "moderate",
  orbitron: "moderate",
  "spider-man-web-adventure": "moderate",
  "cars-road-trip": "moderate",
  "toy-soldiers-parachute-drop": "moderate",

  "rustler-roundup-shootin-gallery": "low",
  "phantom-manor": "moderate",
  "pirates-of-the-caribbean": "moderate",
  "snow-white": "low",
  pinocchio: "low",
  "lancelots-carousel": "low",
  "peter-pan-flight": "low",
  dumbo: "low",
  "casey-jr-circus-train": "low",
  "storybook-land-canal": "low",
  "its-a-small-world": "low",
  ratatouille: "low",
  "slinky-dog-zigzag-spin": "low"
};

const minHeightCmById = {
  "big-thunder-mountain": 102,
  "indiana-jones": 140,
  "star-tours": 102,
  "hyperspace-mountain": 120,
  autopia: 81,
  "avengers-assemble-flight-force": 120,
  "tower-of-terror": 102,
  "rc-racer": 120,
  "toy-soldiers-parachute-drop": 81
};

const minHeightSoloCmById = {
  autopia: 132
};

const adultFocused = new Set([
  "indiana-jones",
  "hyperspace-mountain",
  "avengers-assemble-flight-force",
  "tower-of-terror",
  "rc-racer"
]);

const toddlerFriendly = new Set([
  "horse-drawn-streetcars",
  "main-street-vehicles",
  "thunder-mesa-riverboat-landing",
  "pirates-beach",
  "pocahontas-indian-village",
  "dumbo",
  "its-a-small-world",
  "lancelots-carousel",
  "casey-jr-circus-train",
  "storybook-land-canal",
  "slinky-dog-zigzag-spin",
  "cars-road-trip",
  "ratatouille"
]);

const indoorById = {
  "phantom-manor": true,
  "pirates-of-the-caribbean": true,
  "snow-white": true,
  pinocchio: true,
  "peter-pan-flight": true,
  "its-a-small-world": true,
  "buzz-lightyear-laser-blast": true,
  "star-tours": true,
  "hyperspace-mountain": true,
  "les-mysteres-du-nautilus": true,
  "starport": true,
  "discoveryland-theatre": true,
  "the-chaparral-theater": true,
  "videopolis-theatre": true,
  "meet-mickey-mouse": true,
  "princess-pavillion": true,
  ratatouille: true,
  "spider-man-web-adventure": true,
  "avengers-assemble-flight-force": true,
  "tower-of-terror": true,
  "mickey-and-the-magician": true,
  "together-pixar-musical-adventure": true,
  "bistrot-chez-remy": true,
  "marvel-pym-kitchen": true,
  "stark-factory-pizza-pasta": true
};

function normalizeLandTag(land) {
  return land
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildAudience(id, type, thrillLevel) {
  if (type === "dining") {
    return ["toddlers", "family", "adults"];
  }
  if (type === "character" || type === "show") {
    return ["kids", "family"];
  }
  if (adultFocused.has(id) || thrillLevel === "high") {
    return ["teens", "adults"];
  }
  if (toddlerFriendly.has(id)) {
    return ["toddlers", "kids", "family"];
  }
  return ["kids", "family", "teens"];
}

function buildMetadata(attraction) {
  const type = attractionTypeById[attraction.id] ?? "ride";
  const thrillLevel = thrillLevelById[attraction.id] ?? (type === "ride" ? "low" : "low");
  const minHeightCm = minHeightCmById[attraction.id] ?? null;
  const minHeightSoloCm = minHeightSoloCmById[attraction.id] ?? null;
  const tags = [
    type,
    `land:${normalizeLandTag(attraction.land)}`,
    `thrill:${thrillLevel}`,
    ...(minHeightCm ? ["height-restriction"] : ["any-height"])
  ];

  if (type === "show") tags.push("live-entertainment");
  if (type === "character") tags.push("meet-and-greet");
  if (type === "dining") tags.push("food");
  if (type === "walkthrough") tags.push("self-guided");
  if (type === "transport") tags.push("scenic-transport");

  return {
    attractionType: type,
    thrillLevel,
    targetAudience: buildAudience(attraction.id, type, thrillLevel),
    minHeightCm,
    minHeightSoloCm,
    indoor: indoorById[attraction.id] ?? false,
    tags: Array.from(new Set(tags))
  };
}

function enrichFile(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  const raw = fs.readFileSync(filePath, "utf8");
  const attractions = JSON.parse(raw);
  const enriched = attractions.map((attraction) => ({
    ...attraction,
    metadata: buildMetadata(attraction)
  }));
  fs.writeFileSync(filePath, `${JSON.stringify(enriched, null, 2)}\n`, "utf8");
  return { filePath, count: enriched.length };
}

const results = [
  enrichFile("frontend/src/data/parks/disneylandPark.json"),
  enrichFile("frontend/src/data/parks/waltDisneyStudiosPark.json")
];

for (const result of results) {
  console.log(`Updated ${result.filePath} (${result.count} attractions)`);
}
