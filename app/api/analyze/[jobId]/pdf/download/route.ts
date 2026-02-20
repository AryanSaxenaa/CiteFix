import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/store";
import { generateBriefHtml } from "@/lib/brief-template";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Try to get PDF from the pdf route's store
  try {
    const { getPdfBuffer } = await import("../route");
    const pdfBuffer = getPdfBuffer(jobId);

    if (pdfBuffer) {
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="CiteFix-Brief-${new URL(job.domain).hostname}.pdf"`,
        },
      });
    }
  } catch {
    // PDF buffer not available
  }

  // Fallback: serve the HTML brief directly
  const html = generateBriefHtml(job);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="CiteFix-Brief-${new URL(job.domain).hostname}.html"`,
    },
  });
}
