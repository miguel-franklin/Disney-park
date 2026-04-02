import fs from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const parkJsonFileById: Record<string, string> = {
  "disneyland-park": "src/data/parks/disneylandPark.json",
  "walt-disney-studios-park": "src/data/parks/waltDisneyStudiosPark.json"
};

export default defineConfig({
  base: "/Disney-park/",
  plugins: [
    react(),
    {
      name: "local-coordinate-save-api",
      configureServer(server) {
        server.middlewares.use("/__save-coordinates", async (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
            return;
          }

          try {
            const chunks: Uint8Array[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
            }
            const payloadRaw = Buffer.concat(chunks).toString("utf8");
            const payload = JSON.parse(payloadRaw) as {
              parkId?: string;
              coordinates?: Array<{ id: string; x: number; y: number }>;
            };

            const parkId = payload.parkId ?? "";
            const coords = payload.coordinates ?? [];
            const relativePath = parkJsonFileById[parkId];
            if (!relativePath) {
              throw new Error(`Unsupported parkId: ${parkId}`);
            }

            const filePath = path.resolve(server.config.root, relativePath);
            const currentRaw = await fs.readFile(filePath, "utf8");
            const attractions = JSON.parse(currentRaw) as Array<Record<string, unknown>>;
            const byId = new Map(coords.map((c) => [c.id, c]));

            const updated = attractions.map((entry) => {
              const id = String(entry.id ?? "");
              const match = byId.get(id);
              if (!match) {
                return entry;
              }
              return {
                ...entry,
                x: Number(match.x.toFixed(2)),
                y: Number(match.y.toFixed(2))
              };
            });

            await fs.writeFile(filePath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, updated: coords.length, filePath: relativePath }));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : "Unknown save error"
              })
            );
          }
        });
      }
    }
  ]
});
