import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FestivalEvent, Venue } from "@/types/festival";

export type LocationMatchDebug = {
  totalRows: number;
  confirmedRows: number;
  matchedRows: number;
  unmatchedLocations: string[];
};

export type FestivalDataResult = {
  venues: Venue[];
  events: FestivalEvent[];
  sourceLabel: string;
  debug: LocationMatchDebug;
};

type RecommendationDataset = {
  metadata?: {
    title?: string;
    created?: string;
    description?: string;
    coordinate_caveat?: string;
  };
  items?: RecommendationItem[];
};

type RecommendationItem = {
  Name?: unknown;
  Address?: unknown;
  Alias?: unknown;
  Person?: unknown;
  Category?: unknown;
  Categories?: unknown;
  Description?: unknown;
  Lat?: unknown;
  Long?: unknown;
  MapType?: unknown;
  GeoConfidence?: unknown;
  Notes?: unknown;
  SourceThread?: unknown;
  Favorite?: unknown;
  WebsiteUrl?: unknown;
  GoogleMapsUrl?: unknown;
  ThumbnailUrl?: unknown;
  HoursSummary?: unknown;
  PriceLevel?: unknown;
};

const RECOMMENDATIONS_PATH = path.join(process.cwd(), "nola_reddit_recommendations_structured.json");

const CATEGORY_COLORS = [
  "#c2410c",
  "#0f766e",
  "#7c3aed",
  "#b45309",
  "#0369a1",
  "#be123c",
  "#15803d",
  "#6d28d9",
  "#a16207",
  "#0e7490",
  "#9f1239",
  "#4d7c0f",
];

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => asString(entry)).filter(Boolean);
  }
  const single = asString(value);
  return single ? [single] : [];
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string): string {
  return normalizeText(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "") || "recommendation";
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getCategoryAccent(category: string): string {
  return CATEGORY_COLORS[hashString(category) % CATEGORY_COLORS.length];
}

function mapRecommendationToVenue(item: RecommendationItem, index: number): Venue | null {
  const name = asString(item.Name);
  if (!name) return null;

  const category = asString(item.Category) || "Uncategorized";
  const categories = asStringList(item.Categories);
  const mapType = asString(item.MapType) || "place";
  const address = asString(item.Address);
  const description = asString(item.Description);
  const lat = asNumber(item.Lat);
  const lng = asNumber(item.Long);
  const aliases = asStringList(item.Alias);
  const people = asStringList(item.Person);
  const notes = asString(item.Notes);
  const geoConfidence = asString(item.GeoConfidence);
  const sourceThread = asStringList(item.SourceThread);
  const favorite = item.Favorite === true;
  const websiteUrl = asString(item.WebsiteUrl);
  const googleMapsUrl = asString(item.GoogleMapsUrl);
  const thumbnailUrl = asString(item.ThumbnailUrl);
  const hoursSummary = asString(item.HoursSummary);
  const priceLevel = asString(item.PriceLevel);

  return {
    id: `${slugify(name)}-${index + 1}`,
    name,
    label: category,
    shortDescription: address || mapType.replace(/_/g, " "),
    description,
    x: 0,
    y: 0,
    lat: lat ?? undefined,
    lng: lng ?? undefined,
    hasLocation: lat !== null && lng !== null,
    address: address || undefined,
    alias: aliases,
    person: people,
    category,
    categories: categories.length > 0 ? categories : [category],
    mapType,
    geoConfidence: geoConfidence || undefined,
    notes: notes || undefined,
    sourceThread,
    favorite,
    websiteUrl: websiteUrl || undefined,
    googleMapsUrl: googleMapsUrl || undefined,
    thumbnailUrl: thumbnailUrl || undefined,
    hoursSummary: hoursSummary || undefined,
    priceLevel: priceLevel || undefined,
    accent: getCategoryAccent(category),
  };
}

export async function getFestivalData(): Promise<FestivalDataResult> {
  const raw = await readFile(RECOMMENDATIONS_PATH, "utf8");
  const dataset = JSON.parse(raw) as RecommendationDataset;
  const items = Array.isArray(dataset.items) ? dataset.items : [];
  const venues = items
    .map(mapRecommendationToVenue)
    .filter((venue): venue is Venue => venue !== null);

  return {
    venues,
    events: [],
    sourceLabel: dataset.metadata?.title || "New Orleans Reddit Recommendations",
    debug: {
      totalRows: items.length,
      confirmedRows: venues.length,
      matchedRows: venues.filter((venue) => venue.hasLocation).length,
      unmatchedLocations: venues
        .filter((venue) => !venue.hasLocation)
        .map((venue) => venue.name),
    },
  };
}
