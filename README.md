# New Orleans Trip Planner

Interactive New Orleans trip-planning map powered by `nola_reddit_recommendations_structured.json`.

## Data Source

`nola_reddit_recommendations_structured.json` is the source of truth. The app maps each item into a recommendation pin using:

- `Name`
- `Address`
- `Alias`
- `Person`
- `Category`
- `Description`
- `Lat`
- `Long`
- `MapType`
- `GeoConfidence`
- `Notes`
- `Comments`
- `SourceThread`
- `WebsiteUrl`
- `GoogleMapsUrl`
- `ThumbnailUrl`
- `HoursSummary`
- `PriceLevel`

Recommendations without coordinates stay in the dataset but do not render as map pins.

## Local Development

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run backfill:thumbnails`

The Calendar/Schedule surfaces are intentionally blank until the dataset includes timed events.

## Google Maps Configuration

The map runs on Google Maps JavaScript API and expects local keys in `.env`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_maps_key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_javascript_map_id
GOOGLE_MAPS_API_KEY=your_server_places_key
```

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is used in the browser for the interactive map. Restrict it to the Maps JavaScript API and your allowed HTTP referrers, such as localhost and your deployed domain.

`NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` is a Google Maps Platform Map ID for JavaScript maps. It is required for Advanced Marker rendering. The app falls back to `DEMO_MAP_ID` for local development, but production should use a Map ID from the same Google Cloud project as the browser key.

`GOOGLE_MAPS_API_KEY` is only used by the local thumbnail backfill script. Restrict it to Places API (New), and do not use browser HTTP referrer restrictions for this server-side key.

## Thumbnail Backfill

Recommendation cards use hardcoded `ThumbnailUrl` values when present. Normal site usage does not call Places API for thumbnails.

To fill missing thumbnails for records that have `GoogleMapsUrl` but no `WebsiteUrl` or `ThumbnailUrl`, run a dry run first:

```bash
npm run backfill:thumbnails -- --retries=5
```

If the output looks right, write the updates into `nola_reddit_recommendations_structured.json`:

```bash
npm run backfill:thumbnails -- --write --retries=5
```

The script skips records that already have `ThumbnailUrl`, so it can be rerun after adding new recommendations without re-querying already backfilled thumbnails.
