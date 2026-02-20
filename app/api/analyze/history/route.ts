import { NextRequest, NextResponse } from "next/server";
import { getAllJobs, getJobsByDomain } from "@/lib/store";

/**
 * GET /api/analyze/history
 * 
 * Returns all past analyses, optionally filtered by domain.
 * Query params:
 *   domain - filter by domain (optional)
 */
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain");

  try {
    const jobs = domain
      ? await getJobsByDomain(domain)
      : await getAllJobs();

    // Return lightweight summaries (omit heavy payload fields)
    const summaries = jobs.map((job) => ({
      jobId: job.jobId,
      domain: job.domain,
      topic: job.topic,
      status: job.status,
      stage: job.stage,
      stageLabel: job.stageLabel,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      score: job.patternResults?.citationProbabilityScore ?? null,
      projectedScore: job.patternResults?.projectedScore ?? null,
      gapCount: job.patternResults?.gaps?.length ?? 0,
      citedUrlCount: job.discoveryResults?.citedUrls?.length ?? 0,
      userDomainFound: job.discoveryResults?.userDomainFound ?? false,
      depth: job.config.depth,
      country: job.config.country,
      hasPdf: !!job.pdfUrl,
    }));

    return NextResponse.json({ jobs: summaries, total: summaries.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
