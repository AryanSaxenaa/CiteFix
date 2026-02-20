import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/store";
import { runExpressAgent } from "@/lib/youcom";
import { GeneratedAssets, ContentSection, LinkRecommendation, GapItem } from "@/lib/types";

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
      stage: 5,
      stageLabel: "Generating implementation assets via You.com Express Agent...",
    });

    const assets: GeneratedAssets = {};
    const gaps = job.patternResults.gaps;
    const hasSchemaGap = gaps.some((g) => g.category === "schema");
    const hasFaqGap = gaps.some((g) => g.category === "faq");
    const hasContentGap = gaps.some(
      (g) => g.category === "content" || g.category === "headings"
    );
    const hasStructureGap = gaps.some((g) => g.category === "structure");

    // Always generate schema if missing — it's the highest-impact AEO fix
    if (hasSchemaGap || job.domainAnalysis.existingSchemaTypes.length === 0) {
      const schemaPrompt = `Generate valid JSON-LD schema markup for a webpage about "${job.topic}" on the domain "${job.domain}". 
Include the following schema types as appropriate: Article, FAQPage, BreadcrumbList, WebPage.
Use realistic data based on the topic. Return ONLY the JSON-LD code block, no explanation.
The schema should be ready to paste into a <script type="application/ld+json"> tag.`;

      const schemaResponse = await runExpressAgent(schemaPrompt);
      const jsonLd = extractCodeBlock(schemaResponse);

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

    // Generate FAQ content section — always generate if user has no FAQ
    if (hasFaqGap || !job.domainAnalysis.hasFaq) {
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

    // Generate rewritten page copy — generate if content/heading gap or low content depth
    if (hasContentGap || job.domainAnalysis.contentDepth < 60) {
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

    // Generate internal link recommendations
    if (hasStructureGap) {
      const linkPrompt = `Generate 5 internal link recommendations for a webpage about "${job.topic}" on ${job.domain}.
For each recommendation, provide:
1. A suggested anchor text
2. A target page path/URL on the same domain that should be linked to
3. A brief reason why this link improves SEO and AI citation probability

Format each recommendation on separate lines like:
LINK: [anchor text] -> [target page] | [reason]

Focus on topically relevant internal pages that would strengthen the content's authority.`;

      const linkResponse = await runExpressAgent(linkPrompt);
      const recommendations = parseLinkRecommendations(linkResponse, job.domain);
      if (recommendations.length > 0) {
        assets.internalLinks = { recommendations };
      }
    }

    // Update gaps' assetGenerated flag based on what was actually generated
    const updatedGaps: GapItem[] = gaps.map((gap) => {
      let generated = false;
      if (gap.category === "schema" && assets.schemaMarkup) generated = true;
      if (gap.category === "faq" && assets.contentSections && assets.contentSections.length > 0) generated = true;
      if ((gap.category === "headings" || gap.category === "content") && assets.rewrittenCopy) generated = true;
      if (gap.category === "structure" && assets.internalLinks && assets.internalLinks.recommendations.length > 0) generated = true;
      return { ...gap, assetGenerated: generated };
    });

    updateJob(jobId, {
      stage: 5,
      stageLabel: "Asset generation complete",
      generatedAssets: assets,
      patternResults: { ...job.patternResults, gaps: updatedGaps },
    });

    return NextResponse.json({
      success: true,
      assetsGenerated: {
        schema: !!assets.schemaMarkup,
        faq: (assets.contentSections?.length ?? 0) > 0,
        rewrittenCopy: !!assets.rewrittenCopy,
        internalLinks: (assets.internalLinks?.recommendations?.length ?? 0) > 0,
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

function parseLinkRecommendations(text: string, domain: string): LinkRecommendation[] {
  const recommendations: LinkRecommendation[] = [];
  const lines = text.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    // Match "LINK: [anchor] -> [target] | [reason]" format
    const linkMatch = line.match(/LINK:\s*\[?(.+?)\]?\s*->\s*\[?(.+?)\]?\s*\|\s*(.+)/i);
    if (linkMatch) {
      recommendations.push({
        fromPage: domain,
        toPage: linkMatch[2].trim(),
        anchorText: linkMatch[1].trim(),
        reason: linkMatch[3].trim(),
      });
      continue;
    }

    // Fallback: match numbered lists like "1. Anchor: ... Target: ... Reason: ..."
    const numberedMatch = line.match(/^\d+[\.\)]\s*(.+)/);
    if (numberedMatch && recommendations.length < 5) {
      const content = numberedMatch[1];
      // Try to parse "anchor text" -> target | reason pattern more loosely
      const arrowMatch = content.match(/["""]?(.+?)["""]?\s*(?:->|→|to)\s*(.+?)(?:\s*[|\-–—]\s*(.+))?$/i);
      if (arrowMatch) {
        recommendations.push({
          fromPage: domain,
          toPage: arrowMatch[2].trim(),
          anchorText: arrowMatch[1].trim(),
          reason: arrowMatch[3]?.trim() || "Improves topical relevance and internal link structure",
        });
      }
    }
  }

  // If structured parsing fails, create recommendations from any meaningful lines
  if (recommendations.length === 0) {
    const meaningfulLines = lines.filter((l) =>
      l.match(/^\d+[\.\)]|^[-•*]|anchor|link|recommend/i)
    );
    for (const line of meaningfulLines.slice(0, 5)) {
      const cleaned = line.replace(/^\d+[\.\)]\s*|^[-•*]\s*/, "").trim();
      if (cleaned.length > 10) {
        recommendations.push({
          fromPage: domain,
          toPage: domain,
          anchorText: cleaned.slice(0, 60),
          reason: cleaned,
        });
      }
    }
  }

  return recommendations.slice(0, 5);
}
