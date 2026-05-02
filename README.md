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
- `SourceThread`

Recommendations without coordinates stay in the dataset but do not render as map pins.

## Local Development

- `npm run dev`
- `npm run build`
- `npm run lint`

The Calendar/Schedule surfaces are intentionally blank until the dataset includes timed events.
