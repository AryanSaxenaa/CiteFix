import { NextRequest, NextResponse } from "next/server";
import { createJob, generateJobId } from "@/lib/store";
import { AnalysisJob, CreateAnalysisRequest } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body: CreateAnalysisRequest = await req.json();

    if (!body.domain || !body.topic) {
      return NextResponse.json(
        { error: "domain and topic are required" },
        { status: 400 }
      );
    }

    // Normalize domain
    let domain = body.domain.trim().toLowerCase();
    if (!domain.startsWith("http")) {
      domain = `https://${domain}`;
    }

    // Validate URL
    try {
      new URL(domain);
    } catch {
      return NextResponse.json(
        { error: "Invalid domain URL" },
        { status: 400 }
      );
    }

    const jobId = generateJobId();

    const job: AnalysisJob = {
      jobId,
      domain,
      topic: body.topic.trim(),
      intentVariants: [],
      config: {
        depth: body.config?.depth || "standard",
        sourceTypes: body.config?.sourceTypes || ["web"],
        outputFormat: body.config?.outputFormat || "both",
        competitors: body.config?.competitors || [],
        country: body.config?.country || "US",
      },
      status: "pending",
      stage: 0,
      stageLabel: "Job created",
      createdAt: Date.now(),
    };

    createJob(job);

    return NextResponse.json({ jobId, status: "pending" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
