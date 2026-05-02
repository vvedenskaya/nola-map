import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA_PATH = path.join(process.cwd(), "nola_reddit_recommendations_structured.json");
const DRY_RUN = !process.argv.includes("--write");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : null;
const retryArg = process.argv.find((arg) => arg.startsWith("--retries="));
const MAX_RETRIES = retryArg ? Number(retryArg.split("=")[1]) : 3;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function loadEnvFile() {
  return readFile(path.join(process.cwd(), ".env"), "utf8")
    .then((contents) => {
      for (const rawLine of contents.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#") || !line.includes("=")) continue;
        const [key, ...valueParts] = line.split("=");
        const value = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
        process.env[key.trim()] = value;
      }
    })
    .catch(() => {});
}

function getApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
}

function getApiKeySource() {
  return process.env.GOOGLE_MAPS_API_KEY ? "GOOGLE_MAPS_API_KEY" : "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY";
}

function maskApiKey(value) {
  if (!value) return "(missing)";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function getQueryFromGoogleMapsUrl(rawUrl) {
  if (!rawUrl) return "";
  try {
    const url = new URL(rawUrl);
    const query = url.searchParams.get("query") || url.searchParams.get("q");
    if (query) return query.trim();

    const placePathMatch = url.pathname.match(/\/place\/([^/]+)/);
    if (placePathMatch?.[1]) {
      return decodeURIComponent(placePathMatch[1].replace(/\+/g, " ")).trim();
    }
  } catch {
    return "";
  }
  return "";
}

function buildTextQuery(item) {
  return getQueryFromGoogleMapsUrl(item.GoogleMapsUrl) || [item.Name, item.Address].filter(Boolean).join(" ").trim();
}

async function googleFetch(url, options, apiKey) {
  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        "X-Goog-Api-Key": apiKey,
      },
    });
    if (response.ok) {
      return response.json();
    }

    const body = await response.text();
    lastError = new Error(`${response.status} ${response.statusText}: ${body.slice(0, 240)}`);
    const shouldRetry =
      attempt < MAX_RETRIES &&
      (body.includes("API_KEY_EXPIRED") ||
        body.includes("API key expired") ||
        response.status === 429 ||
        response.status >= 500);

    if (!shouldRetry) {
      throw lastError;
    }

    await sleep(1500 * (attempt + 1));
  }
  throw lastError ?? new Error("Google request failed");
}

function formatError(error) {
  return error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 220) : String(error);
}

async function resolvePlace(item, apiKey) {
  const textQuery = buildTextQuery(item);
  if (!textQuery) return null;

  const body = {
    textQuery,
    maxResultCount: 1,
  };

  if (typeof item.Lat === "number" && typeof item.Long === "number") {
    body.locationBias = {
      circle: {
        center: {
          latitude: item.Lat,
          longitude: item.Long,
        },
        radius: 500,
      },
    };
  }

  const data = await googleFetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "places.displayName,places.googleMapsUri,places.photos",
      },
      body: JSON.stringify(body),
    },
    apiKey
  );

  return data.places?.[0] ?? null;
}

async function resolvePhotoUri(photoName, apiKey) {
  if (!photoName) return "";
  const data = await googleFetch(
    `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=640&maxHeightPx=320&skipHttpRedirect=true`,
    {},
    apiKey
  );
  return data.photoUri || "";
}

await loadEnvFile();
const apiKey = getApiKey();
if (!apiKey) {
  throw new Error("Missing GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
}
console.log(`Using ${getApiKeySource()} ${maskApiKey(apiKey)}`);

const raw = await readFile(DATA_PATH, "utf8");
const dataset = JSON.parse(raw);
const items = Array.isArray(dataset.items) ? dataset.items : [];
const allCandidates = items.filter((item) => item.GoogleMapsUrl && !item.WebsiteUrl && !item.ThumbnailUrl);
const candidates = Number.isFinite(LIMIT) && LIMIT !== null ? allCandidates.slice(0, LIMIT) : allCandidates;

let updatedCount = 0;
let skippedCount = 0;

for (const item of candidates) {
  let place = null;
  try {
    place = await resolvePlace(item, apiKey);
  } catch (error) {
    skippedCount += 1;
    console.log(`skip: ${item.Name} (place lookup: ${formatError(error)})`);
    continue;
  }

  let photoUri = "";
  const photoName = place?.photos?.[0]?.name;
  if (photoName) {
    try {
      photoUri = await resolvePhotoUri(photoName, apiKey);
    } catch (error) {
      console.log(`warn: ${item.Name} (photo lookup: ${formatError(error)})`);
    }
  }

  if (!place?.googleMapsUri && !photoUri) {
    skippedCount += 1;
    console.log(`skip: ${item.Name} (no place URL or photo)`);
    continue;
  }

  if (place.googleMapsUri) {
    item.GoogleMapsUrl = place.googleMapsUri;
  }
  if (photoUri) {
    item.ThumbnailUrl = photoUri;
  }
  updatedCount += 1;
  console.log(`update: ${item.Name}${photoUri ? " + thumbnail" : ""}`);
}

if (DRY_RUN) {
  console.log(`Dry run complete: ${updatedCount} would update, ${skippedCount} skipped.`);
  console.log("Run `npm run backfill:thumbnails -- --write` to write changes.");
} else {
  await writeFile(DATA_PATH, `${JSON.stringify(dataset, null, 2)}\n`);
  console.log(`Wrote ${updatedCount} updates, ${skippedCount} skipped.`);
}
