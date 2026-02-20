import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/store";
import { runExpressAgent } from "@/lib/youcom";
import { GeneratedAssets, ContentSection } from "@/lib/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!job.patternResults || !job.domainAnalysis) {
    return NextResponse.json(
      { error: "Run pattern analysis first" },
      { status: 400 }
    );
  }

  try {
    updateJob(jobId, {
      stage: 4,
      stageLabel: "Generating implementation assets...",
    });

    const assets: GeneratedAssets = {};
    const gaps = job.patternResults.gaps;
    const hasSchemaGap = gaps.some((g) => g.category === "schema");
    const hasFaqGap = gaps.some((g) => g.category === "faq");
    const hasContentGap = gaps.some(
      (g) => g.category === "content" || g.category === "headings"
    );

    // Generate JSON-LD schema using You.com Agent
    if (hasSchemaGap) {
      const schemaPrompt = `Generate valid JSON-LD schema markup for a webpage about "${job.topic}" on the domain "${job.domain}". 
Include the following schema types as appropriate: Article, FAQPage, BreadcrumbList, WebPage.
Use realistic data based on the topic. Return ONLY the JSON-LD code block, no explanation.
The schema should be ready to paste into a <script type="application/ld+json"> tag.`;

      const schemaResponse = await runExpressAgent(schemaPrompt);
      const jsonLd = extractCodeBlock(schemaResponse);

      // Determine schema types
      const types: string[] = [];
      if (jsonLd.includes("FAQPage")) types.push("FAQPage");
      if (jsonLd.includes("Article")) types.push("Article");
      if (jsonLd.includes("BreadcrumbList")) types.push("BreadcrumbList");
      if (jsonLd.includes("WebPage")) types.push("WebPage");
      if (jsonLd.includes("Product")) types.push("Product");
      if (types.length === 0) types.push("WebPage");

      assets.schemaMarkup = {
        jsonLd: jsonLd,
        types,
        isValid: jsonLd.includes("@context") && jsonLd.includes("@type"),
      };
    }

    // Generate FAQ content section
    if (hasFaqGap) {
      const faqPrompt = `Generate 10 high-quality FAQ questions and answers about "${job.topic}" for the website ${job.domain}.
Format as a clean FAQ section. Each question should be on its own line starting with "Q: " and each answer starting with "A: ".
The answers should be comprehensive, authoritative, and written in a professional tone.
Make the questions reflect what real users would ask AI search engines about this topic.`;

      const faqResponse = await runExpressAgent(faqPrompt);
      const faqSection: ContentSection = {
        title: `Frequently Asked Questions: ${job.topic}`,
        type: "faq",
        markdown: faqResponse,
        html: faqToHtml(faqResponse),
      };
      assets.contentSections = [faqSection];
    }

    // Generate rewritten page copy
    if (hasContentGap) {
      const bestArchetype = job.patternResults.archetypes[0];
      const copyPrompt = `Rewrite the following page content for the topic "${job.topic}" on ${job.domain}.
The rewrite should match this citation archetype: "${bestArchetype?.name || "Authority Hub with Schema"}".
Key requirements:
- Strong H1 followed by clear H2/H3 hierarchy
- Comprehensive coverage of the topic (minimum 800 words)
- Include specific facts, statistics, and expert-level detail
- Write in an authoritative, professional tone
- Structure content so AI engines can easily extract direct answers
- Include natural question-answer patterns within the content

Current page content summary: ${job.domainAnalysis.page.content.slice(0, 500)}

Return the rewritten content in markdown format.`;

      const copyResponse = await runExpressAgent(copyPrompt);
      assets.rewrittenCopy = {
        markdown: copyResponse,
        plainText: copyResponse.replace(/[#*_\[\]()]/g, ""),
        wordCount: copyResponse.split(/\s+/).length,
      };
    }

    updateJob(jobId, {
      stage: 4,
      stageLabel: "Asset generation complete",
      generatedAssets: assets,
      status: "complete",
      completedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      assetsGenerated: {
        schema: !!assets.schemaMarkup,
        faq: (assets.contentSections?.length ?? 0) > 0,
        rewrittenCopy: !!assets.rewrittenCopy,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    updateJob(jobId, { status: "failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractCodeBlock(text: string): string {
  // Extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();

  // Try to find raw JSON
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1) {
    return text.slice(jsonStart, jsonEnd + 1);
  }

  return text;
}

function faqToHtml(faqText: string): string {
  const lines = faqText.split("\n").filter((l) => l.trim());
  let html = '<div class="faq-section">';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("Q:") || trimmed.startsWith("**Q")) {
      const question = trimmed.replace(/^(?:Q:|[*]+Q[*]*:?\s*)/i, "").trim();
      html += `<div class="faq-item"><h3 class="faq-question">${question}</h3>`;
    } else if (trimmed.startsWith("A:") || trimmed.startsWith("**A")) {
      const answer = trimmed.replace(/^(?:A:|[*]+A[*]*:?\s*)/i, "").trim();
      html += `<p class="faq-answer">${answer}</p></div>`;
    }
  }

  html += "</div>";
  return html;
}
