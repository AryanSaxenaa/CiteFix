import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const exportData = {
    _meta: {
      exportedAt: new Date().toISOString(),
      generator: "Scoutlytics",
      version: "1.0",
      jobId,
    },
    domain: job.domain,
    topic: job.topic,
    config: job.config,
    citationScore: job.patternResults?.citationProbabilityScore ?? null,
    projectedScore: job.patternResults?.projectedScore ?? null,
    gaps: job.patternResults?.gaps ?? [],
    archetypes: job.patternResults?.archetypes ?? [],
    userArchetypeMatch: job.patternResults?.userArchetypeMatch ?? null,
    citedUrls: job.discoveryResults?.citedUrls ?? [],
    queryVariants: job.discoveryResults?.queryVariants ?? [],
    userDomainFound: job.discoveryResults?.userDomainFound ?? false,
    userDomainPosition: job.discoveryResults?.userDomainPosition,
    domainAnalysis: job.domainAnalysis ?? null,
    generatedAssets: {
      schemaMarkup: job.generatedAssets?.schemaMarkup ?? null,
      rewrittenCopy: job.generatedAssets?.rewrittenCopy ?? null,
      contentSections: job.generatedAssets?.contentSections ?? [],
      internalLinks: job.generatedAssets?.internalLinks ?? null,
    },
    advancedResearch: job.advancedResearch ?? null,
    apiTracking: job.apiTracking ?? null,
    timing: {
      completedAt: job.completedAt ?? null,
    },
  };

  const json = JSON.stringify(exportData, null, 2);
  const hostname = new URL(job.domain).hostname;

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="scoutlytics-export-${hostname}.json"`,
    },
  });
}
