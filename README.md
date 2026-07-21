# Farm Emissions Portfolio

Lender-facing prototype for **Agri Credit Canada**, a sample agricultural lender
financing ~78 large corporate farm operations: carbon emissions across its farm loan
portfolio on a full-screen interactive map. Frontend only — all data is hardcoded in
[`src/data/farms.ts`](src/data/farms.ts) (77 seeded sample farms plus one demo farm,
Gavelin Farms, backed by a real Holos whole-farm emissions run).

**Live demo:** https://a-lie101.github.io/farm-emissions-portfolio/

## Features

- Google Maps-style map (CARTO Voyager tiles, Esri satellite toggle) with marker
  clustering and zoom-scaled pins colored by emissions intensity
- Slide-in farm panel: emissions breakdown with soil-carbon sink handling, Holos-style
  per-gas / per-field detail, phase-offset crop rotations, practices, soil profile,
  and data provenance
- Client-side `.xlsx` export mirroring the Holos "Detailed Emission Report" layout

## Stack

Vite · React 18 · TypeScript · Tailwind CSS 4 · react-leaflet 4 + leaflet.markercluster · SheetJS

## Run locally

```bash
npm install
npm run dev
```

Deploys to GitHub Pages automatically on every push to `main`
(see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).
