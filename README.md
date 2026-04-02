# Disneyland Paris Explorer

React app for **Disneyland Park** and **Walt Disney Studios Park**: static **official-style guide maps**, draggable/zoomable view, tap targets aligned to **printed map numbers**, and a detail panel (description, images, YouTube).

## Disneyland Park map

The main park uses [`frontend/public/maps/disneyland-paris-park.jpg`](frontend/public/maps/disneyland-paris-park.jpg). Paths are set in [`frontend/src/data/parks.ts`](frontend/src/data/parks.ts).

Pins are anchored so the **center of the red dot** lines up with **`x` / `y`** (0–100) — use the same spot as the small **pin dot under each printed number**, not the center of the big number circle. Each entry can include **`guideMapNumber`** for your own reference (the map UI shows only dots, not numbers). When you change map resolution/crop, nudge **`x` / `y`** in [`disneylandPark.json`](frontend/src/data/parks/disneylandPark.json).

## Disney Adventure World (second park)

Uses [`frontend/public/maps/disney-adventure-world-park.png`](frontend/public/maps/disney-adventure-world-park.png) (concept art–style layout: World Premiere Plaza, Avengers Campus, central lake, World of Frozen, Worlds of Pixar). Attraction `x` / `y` values are approximate—nudge them when an official numbered guidemap is available.

## Extract maps from PDF (optional)

1. Create a Python venv (once):

   ```bash
   cd /path/to/Travel
   python3 -m venv tools/.venv
   ./tools/.venv/bin/pip install pymupdf
   ```

2. Export PNGs:

   ```bash
   ./tools/.venv/bin/python tools/extract_pdf_maps.py disneyland-paris.pdf \
     -o frontend/public/maps \
     -s 2.5 \
     --prefix pdf-map-page-
   ```

   Use whatever PDF path you have (e.g. `disneyland.pdf`). Then point `mapImagePath` in `parks.ts` at the files you want.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

No API keys required.

## Data

- Attractions: [`frontend/src/data/parks/*.json`](frontend/src/data/parks/)
- Validate: `npm run validate:data` (from `frontend/`)
