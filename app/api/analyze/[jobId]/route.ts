import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/store";
import { AnalysisStatusResponse } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const response: AnalysisStatusResponse = {
    jobId: job.jobId,
    domain: job.domain,
    topic: job.topic,
    status: job.status,
    stage: job.stage,
    stageLabel: job.stageLabel,
    discoveryResults: job.discoveryResults,
    extractionResults: job.extractionResults,
    domainAnalysis: job.domainAnalysis,
    patternResults: job.patternResults,
    generatedAssets: job.generatedAssets,
    pdfUrl: job.pdfUrl,
    error: job.error,
  };

  return NextResponse.json(response);
}
