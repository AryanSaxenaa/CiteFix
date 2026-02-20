import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/store";
import { analyzePatterns } from "@/lib/analysis";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!job.extractionResults || !job.domainAnalysis) {
    return NextResponse.json(
      { error: "Run extraction stage first" },
      { status: 400 }
    );
  }

  try {
    await updateJob(jobId, {
      stage: 3,
      stageLabel: "Running citation pattern analysis...",
    });

    const patternResults = analyzePatterns(
      job.extractionResults.pages,
      job.domainAnalysis
    );

    await updateJob(jobId, {
      stage: 3,
      stageLabel: "Pattern analysis complete",
      patternResults,
    });

    return NextResponse.json({ success: true, patternResults });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    await updateJob(jobId, { status: "failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
