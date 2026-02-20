import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/store";
import { generatePdfFromHtml } from "@/lib/foxit";
import { generateBriefHtml } from "@/lib/brief-template";
import { generateBriefDocx } from "@/lib/docx-generator";

// In-memory store for download — stores buffer + format
const briefStore = new Map<string, { buffer: Buffer; format: "pdf" | "docx" }>();

export function getBriefData(jobId: string): { buffer: Buffer; format: "pdf" | "docx" } | undefined {
  return briefStore.get(jobId);
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

  const hostname = new URL(job.domain).hostname;

  // Try Foxit PDF first
  try {
    updateJob(jobId, {
      stage: 6,
      stageLabel: "Generating PDF implementation brief via Foxit...",
    });

    const briefHtml = generateBriefHtml(job);
    const pdfBuffer = await generatePdfFromHtml(briefHtml, hostname);

    briefStore.set(jobId, { buffer: pdfBuffer, format: "pdf" });

    const pdfUrl = `/api/analyze/${jobId}/pdf/download`;

    updateJob(jobId, {
      stage: 6,
      stageLabel: "PDF brief generated",
      pdfUrl,
      status: "complete",
      completedAt: Date.now(),
    });

    return NextResponse.json({ success: true, pdfUrl, format: "pdf" });
  } catch (pdfError) {
    const pdfMsg = pdfError instanceof Error ? pdfError.message : "PDF generation failed";
    console.error(`[PDF] Foxit PDF failed for job ${jobId}: ${pdfMsg}`);
    console.log(`[PDF] Falling back to DOCX generation...`);
  }

  // Fallback: generate DOCX
  try {
    updateJob(jobId, {
      stage: 6,
      stageLabel: "Generating DOCX implementation brief...",
    });

    const docxBuffer = await generateBriefDocx(job);

    briefStore.set(jobId, { buffer: docxBuffer, format: "docx" });

    const pdfUrl = `/api/analyze/${jobId}/pdf/download`;

    updateJob(jobId, {
      stage: 6,
      stageLabel: "Implementation brief generated (DOCX)",
      pdfUrl,
      status: "complete",
      completedAt: Date.now(),
    });

    return NextResponse.json({ success: true, pdfUrl, format: "docx" });
  } catch (docxError) {
    const docxMsg = docxError instanceof Error ? docxError.message : "DOCX generation failed";
    console.error(`[PDF] DOCX fallback also failed for job ${jobId}: ${docxMsg}`);

    updateJob(jobId, {
      stage: 6,
      stageLabel: "Analysis complete (brief generation encountered an issue)",
      status: "complete",
      completedAt: Date.now(),
      error: `Brief generation: ${docxMsg}`,
    });

    return NextResponse.json({ error: docxMsg, partial: true }, { status: 500 });
  }
}
