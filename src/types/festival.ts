export type FestivalDay = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type EventType =
  | "music"
  | "performance"
  | "installation"
  | "exhibition"
  | "lecture"
  | "community"
  | "social"
  | "object"
  | "experience"
  | "film"
  | "dj"
  | "venue"
  | "food"
  | "services";

export type Venue = {
  id: string;
  name: string;
  label: string;
  mapLabel?: string;
  shortDescription: string;
  description: string;
  x: number;
  y: number;
  lat?: number;
  lng?: number;
  hasLocation?: boolean;
  address?: string;
  alias?: string[];
  person?: string[];
  category?: string;
  categories?: string[];
  mapType?: string;
  geoConfidence?: string;
  notes?: string;
  comments?: string;
  sourceThread?: string[];
  favorite?: boolean;
  websiteUrl?: string;
  googleMapsUrl?: string;
  thumbnailUrl?: string;
  hoursSummary?: string;
  priceLevel?: string;
  permanence?: string;
  serviceType?: "garbage" | "water" | "toilets" | "medic";
  accent: string;
};

export type FestivalEvent = {
  id: string;
  venueId: string;
  title: string;
  host: string;
  description: string;
  day: FestivalDay;
  startTime: string;
  endTime: string;
  type: EventType;
  projectTypes?: EventType[];
  thumbnailUrl: string;
  lat?: number;
  lng?: number;
  hasLocation?: boolean;
  permanence?: string;
  serviceType?: "garbage" | "water" | "toilets" | "medic";
  source?: "schedule" | "airtable" | "admin";
  scheduleDate?: string;
  scheduleCategory?: string;
  airtableRecordId?: string;
  airtableProjectName?: string;
  airtableTimeLabel?: string;
};
