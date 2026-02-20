import { NextRequest, NextResponse } from "next/server";
import { generateTopicSuggestions } from "@/lib/youcom";

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      return NextResponse.json(
        { error: "Topic must be at least 3 characters" },
        { status: 400 }
      );
    }

    const suggestions = await generateTopicSuggestions(topic.trim());

    return NextResponse.json({ suggestions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate suggestions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
