import type { EventType, FestivalDay, FestivalEvent, Venue } from "@/types/festival";

export const MAP_DIMENSIONS = {
  width: 0,
  height: 0,
};

export const dayLabels: Record<FestivalDay, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export const eventTypeLabels: Record<EventType, string> = {
  music: "Music",
  performance: "Performance",
  installation: "Installation",
  exhibition: "Exhibition",
  lecture: "Lecture / Talk",
  community: "Recommendation",
  social: "Social",
  object: "Object",
  experience: "Experience",
  film: "Film",
  dj: "Nightlife",
  venue: "Place",
  food: "Food / Drink",
  services: "Tip",
};

export const venues: Venue[] = [];
export const events: FestivalEvent[] = [];
