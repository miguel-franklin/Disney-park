import fs from "node:fs/promises";
import path from "node:path";

const files = [
  "../frontend/src/data/parks/disneylandPark.json",
  "../frontend/src/data/parks/waltDisneyStudiosPark.json"
];

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateAttraction(attraction, file, index) {
  const errors = [];
  const context = `${file}[${index}]`;

  if (!attraction.id || typeof attraction.id !== "string") errors.push(`${context}: missing id`);
  if (!attraction.parkId || typeof attraction.parkId !== "string") errors.push(`${context}: missing parkId`);
  if (!attraction.name || typeof attraction.name !== "string") errors.push(`${context}: missing name`);
  if (!attraction.description || typeof attraction.description !== "string") errors.push(`${context}: missing description`);
  if (typeof attraction.x !== "number" || attraction.x < 0 || attraction.x > 100) errors.push(`${context}: x must be 0-100`);
  if (typeof attraction.y !== "number" || attraction.y < 0 || attraction.y > 100) errors.push(`${context}: y must be 0-100`);

  if (!Array.isArray(attraction.media?.imageUrls) || attraction.media.imageUrls.length < 2) {
    errors.push(`${context}: imageUrls should have at least 2 urls`);
  } else {
    attraction.media.imageUrls.forEach((url, imageIndex) => {
      if (!isHttpUrl(url)) {
        errors.push(`${context}: imageUrls[${imageIndex}] is not a valid URL`);
      }
    });
  }

  if (!isHttpUrl(attraction.media?.youtubeVideoUrl ?? "")) {
    errors.push(`${context}: youtubeVideoUrl is not a valid URL`);
  }

  return errors;
}

async function main() {
  const allErrors = [];

  for (const file of files) {
    const absolute = path.join(new URL(".", import.meta.url).pathname, file);
    const raw = await fs.readFile(absolute, "utf8");
    const attractions = JSON.parse(raw);

    if (!Array.isArray(attractions)) {
      allErrors.push(`${file}: expected an array`);
      continue;
    }

    attractions.forEach((attraction, index) => {
      allErrors.push(...validateAttraction(attraction, file, index));
    });
  }

  if (allErrors.length > 0) {
    console.error("Dataset validation failed:");
    allErrors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log("Dataset validation passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
