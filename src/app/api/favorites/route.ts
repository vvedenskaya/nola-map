import { NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type RecommendationDataset = {
  items?: Array<{
    Name?: unknown;
    Favorite?: unknown;
  }>;
};

const RECOMMENDATIONS_PATH = path.join(process.cwd(), "nola_reddit_recommendations_structured.json");

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { name?: unknown; favorite?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const favorite = body.favorite;

    if (!name || typeof favorite !== "boolean") {
      return NextResponse.json({ error: "Expected name and favorite boolean" }, { status: 400 });
    }

    const raw = await readFile(RECOMMENDATIONS_PATH, "utf8");
    const dataset = JSON.parse(raw) as RecommendationDataset;
    const items = Array.isArray(dataset.items) ? dataset.items : [];
    const item = items.find((entry) => entry.Name === name);

    if (!item) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    item.Favorite = favorite;
    await writeFile(RECOMMENDATIONS_PATH, `${JSON.stringify(dataset, null, 2)}\n`);

    return NextResponse.json({ ok: true, name, favorite });
  } catch (error) {
    console.error("Favorite update failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
