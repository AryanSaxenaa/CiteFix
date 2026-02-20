import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/store";
import { generatePdfFromHtml } from "@/lib/foxit";
import { generateBriefHtml } from "@/lib/brief-template";

// In-memory PDF store for download
const pdfStore = new Map<string, Buffer>();

export function getPdfBuffer(jobId: string): Buffer | undefined {
  return pdfStore.get(jobId);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!job.generatedAssets) {
    return NextResponse.json(
      { error: "Run asset generation first" },
      { status: 400 }
    );
  }

  try {
    updateJob(jobId, {
      stage: 5,
      stageLabel: "Generating PDF implementation brief via Foxit...",
    });

    const briefHtml = generateBriefHtml(job);
    const hostname = new URL(job.domain).hostname;

    const pdfBuffer = await generatePdfFromHtml(briefHtml, hostname);

    // Store PDF buffer for download
    pdfStore.set(jobId, pdfBuffer);

    const pdfUrl = `/api/analyze/${jobId}/pdf/download`;

    updateJob(jobId, {
      stage: 5,
      stageLabel: "PDF brief generated",
      pdfUrl,
      status: "complete",
      completedAt: Date.now(),
    });

    return NextResponse.json({ success: true, pdfUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed";
    console.error(`[PDF] Foxit PDF generation failed for job ${jobId}:`, message);
    // Still mark as complete — PDF is a bonus, results are the core value
    updateJob(jobId, {
      stage: 5,
      stageLabel: "Analysis complete (PDF generation encountered an issue)",
      status: "complete",
      completedAt: Date.now(),
      error: `PDF: ${message}`,
    });
    return NextResponse.json({ error: message, partial: true }, { status: 500 });
  }
}
