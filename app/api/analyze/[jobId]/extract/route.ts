import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/store";
import { extractMultiplePages, extractPageContent } from "@/lib/youcom";
import { analyzeDomain } from "@/lib/analysis";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!job.discoveryResults) {
    return NextResponse.json(
      { error: "Run discovery stage first" },
      { status: 400 }
    );
  }

  try {
    // Stage 2: Extract content from top-cited pages
    await updateJob(jobId, {
      stage: 2,
      stageLabel: `Extracting content from ${job.discoveryResults.citedUrls.length} cited pages...`,
    });

    const urls = job.discoveryResults.citedUrls.map((c) => c.url);
    const pages = await extractMultiplePages(urls);

    const extractionResults = {
      pages,
      extractedCount: pages.filter((p) => p.content.length > 0).length,
    };

    // Stage 2b: Extract user's domain content
    await updateJob(jobId, {
      stage: 2,
      stageLabel: `Analyzing your domain: ${job.domain}...`,
    });

    const userPage = await extractPageContent(job.domain);
    const domainAnalysisResult = analyzeDomain(
      userPage,
      job.discoveryResults.userDomainFound
    );

    await updateJob(jobId, {
      stage: 2,
      stageLabel: "Content extraction complete",
      extractionResults,
      domainAnalysis: domainAnalysisResult,
    });

    return NextResponse.json({
      success: true,
      extractedCount: extractionResults.extractedCount,
      domainAnalysis: {
        existingSchemaTypes: domainAnalysisResult.existingSchemaTypes,
        hasFaq: domainAnalysisResult.hasFaq,
        contentDepth: domainAnalysisResult.contentDepth,
        headingScore: domainAnalysisResult.headingScore,
        citationStatus: domainAnalysisResult.citationStatus,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extraction failed";
    await updateJob(jobId, { status: "failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
