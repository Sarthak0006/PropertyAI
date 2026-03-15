# Frontend Guide

## Tech Stack
- React 18 + TypeScript
- Vite (dev server + build)
- TailwindCSS (styling)
- React Query (data fetching + caching)
- React Router (navigation)
- Axios (HTTP client)
- Lucide Icons

## Pages

| Route             | Component            | Description                    |
|-------------------|----------------------|--------------------------------|
| `/`               | `HomePage`           | Search + Filter + Property Grid|
| `/property/:id`   | `PropertyDetailPage` | Full property details          |
| `/compare`        | `ComparePage`        | Side-by-side comparison table  |

## Key Components

- **SearchBar** — AI-powered with autocomplete, recent/popular searches
- **FilterPanel** — Collapsible with bedrooms, bathrooms, size, amenities, type, sort
- **PropertyCard** — Glassmorphism card with image, stats, compare toggle
- **CompareFloatingBar** — Fixed bar showing selected count + Compare button
- **Pagination** — Smart page range with prev/next

## State Management

- **React Query** — Server state (search results, property details, suggestions)
- **CompareContext** — Client state (selected properties for comparison, max 5)

## Development

```bash
cd frontend
npm install
npm run dev    # → http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:3001`.
