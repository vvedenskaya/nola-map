import { NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type RecommendationDataset = {
  items?: Array<{
    Name?: unknown;
    Comments?: unknown;
  }>;
};

const RECOMMENDATIONS_PATH = path.join(process.cwd(), "nola_reddit_recommendations_structured.json");

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { name?: unknown; comments?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const comments = typeof body.comments === "string" ? body.comments.trim() : null;

    if (!name || comments === null) {
      return NextResponse.json({ error: "Expected name and comments string" }, { status: 400 });
    }

    const raw = await readFile(RECOMMENDATIONS_PATH, "utf8");
    const dataset = JSON.parse(raw) as RecommendationDataset;
    const items = Array.isArray(dataset.items) ? dataset.items : [];
    const item = items.find((entry) => entry.Name === name);

    if (!item) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    item.Comments = comments;
    await writeFile(RECOMMENDATIONS_PATH, `${JSON.stringify(dataset, null, 2)}\n`);

    return NextResponse.json({ ok: true, name, comments });
  } catch (error) {
    console.error("Comment update failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
