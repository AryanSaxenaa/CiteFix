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

  const hostname = new URL(job.domain).hostname;

  // Try to get the generated brief (PDF or DOCX) from the store
  try {
    const { getBriefData } = await import("../route");
    const briefData = getBriefData(jobId);

    if (briefData) {
      if (briefData.format === "pdf") {
        return new NextResponse(new Uint8Array(briefData.buffer), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="Scoutlytics-Brief-${hostname}.pdf"`,
          },
        });
      }

      if (briefData.format === "docx") {
        return new NextResponse(new Uint8Array(briefData.buffer), {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="Scoutlytics-Brief-${hostname}.docx"`,
          },
        });
      }
    }
  } catch {
    // Brief buffer not available, fall through to HTML fallback
  }

  // Last resort fallback: serve the HTML brief directly
  const html = generateBriefHtml(job);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="Scoutlytics-Brief-${hostname}.html"`,
    },
  });
}
