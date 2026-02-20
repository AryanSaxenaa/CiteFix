import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/store";
import { generatePdfFromHtml, generateDocument, uploadDocument, compressPdf, waitForTask, downloadDocument } from "@/lib/foxit";
import { generateBriefHtml } from "@/lib/brief-template";
import { generateBriefDocx } from "@/lib/docx-generator";
import { buildDocGenValues } from "@/lib/docgen-values";

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

  // Strategy 1: Foxit PDF Services (HTML → upload → convert → watermark → compress → download)
  try {
    updateJob(jobId, {
      stage: 6,
      stageLabel: "Generating PDF via Foxit PDF Services...",
    });

    const briefHtml = generateBriefHtml(job);
    const pdfBuffer = await generatePdfFromHtml(briefHtml, hostname);

    briefStore.set(jobId, { buffer: pdfBuffer, format: "pdf" });
    const pdfUrl = `/api/analyze/${jobId}/pdf/download`;

    updateJob(jobId, {
      stage: 6,
      stageLabel: "PDF brief generated via Foxit PDF Services",
      pdfUrl,
      status: "complete",
      completedAt: Date.now(),
    });

    return NextResponse.json({ success: true, pdfUrl, format: "pdf", method: "foxit-pdfservices" });
  } catch (pdfError) {
    const pdfMsg = pdfError instanceof Error ? pdfError.message : "PDF generation failed";
    console.error(`[PDF] Foxit PDF Services failed for job ${jobId}: ${pdfMsg}`);
    console.log(`[PDF] Falling back to Foxit Document Generation API...`);
  }

  // Strategy 2: Foxit Document Generation API (DOCX template → PDF)
  try {
    updateJob(jobId, {
      stage: 6,
      stageLabel: "Generating brief via Foxit Document Generation API...",
    });

    // Generate DOCX content first, then send to DocGen to convert to PDF
    const docxBuffer = await generateBriefDocx(job);
    const templateBase64 = docxBuffer.toString("base64");
    const docGenValues = buildDocGenValues(job);

    const pdfBuffer = await generateDocument(templateBase64, docGenValues, "PDF");

    if (pdfBuffer && pdfBuffer.length > 1000) {
      // Optionally compress the DocGen PDF via PDF Services
      let finalBuffer = pdfBuffer;
      try {
        const uploadedId = await uploadDocument(pdfBuffer, "docgen-brief.pdf");
        const compressTaskId = await compressPdf(uploadedId);
        const compressedDocId = await waitForTask(compressTaskId);
        finalBuffer = await downloadDocument(compressedDocId, `CiteFix-Brief-${hostname}.pdf`);
        console.log(`[PDF] DocGen PDF compressed: ${pdfBuffer.length} → ${finalBuffer.length} bytes`);
      } catch {
        console.log(`[PDF] DocGen PDF compression skipped (non-critical)`);
      }

      briefStore.set(jobId, { buffer: finalBuffer, format: "pdf" });
      const pdfUrl = `/api/analyze/${jobId}/pdf/download`;

      updateJob(jobId, {
        stage: 6,
        stageLabel: "PDF brief generated via Foxit DocGen API",
        pdfUrl,
        status: "complete",
        completedAt: Date.now(),
      });

      return NextResponse.json({ success: true, pdfUrl, format: "pdf", method: "foxit-docgen" });
    }
    throw new Error("DocGen returned empty/invalid PDF");
  } catch (docgenError) {
    const docgenMsg = docgenError instanceof Error ? docgenError.message : "DocGen failed";
    console.error(`[PDF] Foxit DocGen failed for job ${jobId}: ${docgenMsg}`);
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
