import fs from "node:fs/promises";
import path from "node:path";

const root = new URL("../", import.meta.url);
const sourcePath = new URL("./attractions-source.json", root);
const outputDirectory = new URL("../frontend/src/data/parks/", root);

async function main() {
  const raw = await fs.readFile(sourcePath, "utf8");
  const source = JSON.parse(raw);

  const grouped = source.reduce(
    (acc, attraction) => {
      if (!acc[attraction.parkId]) {
        acc[attraction.parkId] = [];
      }
      acc[attraction.parkId].push(attraction);
      return acc;
    },
    {}
  );

  await fs.mkdir(outputDirectory, { recursive: true });

  const fileMap = {
    "disneyland-park": "disneylandPark.json",
    "walt-disney-studios-park": "waltDisneyStudiosPark.json"
  };

  for (const [parkId, attractions] of Object.entries(grouped)) {
    const targetFile = fileMap[parkId];
    if (!targetFile) {
      continue;
    }

    const targetPath = path.join(outputDirectory.pathname, targetFile);
    await fs.writeFile(targetPath, JSON.stringify(attractions, null, 2), "utf8");
  }

  console.log("Dataset files generated successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
