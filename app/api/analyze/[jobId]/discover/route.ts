import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/store";
import { searchCitations } from "@/lib/youcom";

const DEPTH_MAP = { quick: 5, standard: 10, deep: 20 };

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  try {
    updateJob(jobId, {
      status: "running",
      stage: 1,
      stageLabel: `Querying You.com for top-cited pages for "${job.topic}"...`,
    });

    const count = DEPTH_MAP[job.config.depth] || 10;
    const { results, queryVariants } = await searchCitations(
      job.topic,
      count,
      job.config.country
    );

    // Check if user's domain appears in results
    const userHostname = new URL(job.domain).hostname.replace("www.", "");
    const userResult = results.find((r) => {
      try {
        return new URL(r.url).hostname.replace("www.", "") === userHostname;
      } catch {
        return false;
      }
    });

    const discoveryResults = {
      citedUrls: results,
      queryVariants,
      totalResults: results.length,
      userDomainFound: !!userResult,
      userDomainPosition: userResult
        ? results.indexOf(userResult) + 1
        : undefined,
    };

    updateJob(jobId, {
      stage: 1,
      stageLabel: "Citation discovery complete",
      intentVariants: queryVariants,
      discoveryResults,
    });

    return NextResponse.json({ success: true, discoveryResults });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery failed";
    updateJob(jobId, { status: "failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
