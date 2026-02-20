import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/store";
import { runAdvancedAgent, getApiCallLog } from "@/lib/youcom";

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
      stage: 3,
      stageLabel: "Running deep research with You.com Advanced Agent...",
    });

    const gaps = job.patternResults.gaps.map((g) => g.name).join(", ");
    const archetypes = job.patternResults.archetypes
      .map((a) => a.name)
      .join(", ");

    const researchPrompt = `You are an AEO (Answer Engine Optimization) research analyst. Analyze the following topic deeply:

Topic: "${job.topic}"
Domain: ${job.domain}
Current Citation Score: ${job.patternResults.citationProbabilityScore}/100
Detected Gaps: ${gaps}
Winning Archetypes: ${archetypes}

Perform the following analysis:

1. CONTRADICTIONS: Identify 2-3 cases where different sources or AI engines might cite different or contradictory information about this topic. What are the conflicting claims?

2. KNOWLEDGE GAPS: Identify 3-5 subtopics related to "${job.topic}" that have high search interest but low authoritative coverage — these are content opportunities.

3. CONTENT OPPORTUNITIES: Based on what's currently cited, what specific content pieces would give ${job.domain} the highest probability of being cited by AI engines?

Format your response EXACTLY as:
CONTRADICTIONS:
- [contradiction 1]
- [contradiction 2]

KNOWLEDGE_GAPS:
- [gap 1]
- [gap 2]
- [gap 3]

CONTENT_OPPORTUNITIES:
- [opportunity 1]
- [opportunity 2]
- [opportunity 3]`;

    const researchResult = await runAdvancedAgent(researchPrompt);

    // Parse the structured response
    const contradictions = extractSection(researchResult, "CONTRADICTIONS");
    const knowledgeGaps = extractSection(researchResult, "KNOWLEDGE_GAPS");
    const contentOpportunities = extractSection(
      researchResult,
      "CONTENT_OPPORTUNITIES"
    );

    const advancedResearch = {
      insights: researchResult,
      contradictions,
      knowledgeGaps,
      contentOpportunities,
      timestamp: Date.now(),
    };

    // Collect API tracking data
    const apiCalls = getApiCallLog();
    const apiTracking = {
      calls: apiCalls,
      totalCalls: apiCalls.length,
      totalDurationMs: apiCalls.reduce((sum, c) => sum + c.durationMs, 0),
    };

    updateJob(jobId, {
      stage: 3,
      stageLabel: "Advanced research complete",
      advancedResearch,
      apiTracking,
    });

    return NextResponse.json({
      success: true,
      advancedResearch: {
        contradictions: contradictions.length,
        knowledgeGaps: knowledgeGaps.length,
        contentOpportunities: contentOpportunities.length,
      },
    });
  } catch (error) {
    // Research failures are non-critical — don't fail the whole pipeline
    console.error("[Advanced Research] Error:", error);
    const apiCalls = getApiCallLog();
    updateJob(jobId, {
      stage: 3,
      stageLabel: "Research complete (partial)",
      apiTracking: {
        calls: apiCalls,
        totalCalls: apiCalls.length,
        totalDurationMs: apiCalls.reduce((sum, c) => sum + c.durationMs, 0),
      },
    });
    return NextResponse.json({
      success: true,
      partial: true,
      error: error instanceof Error ? error.message : "Research partially failed",
    });
  }
}

function extractSection(text: string, sectionName: string): string[] {
  const items: string[] = [];
  const regex = new RegExp(
    `${sectionName}[:\\s]*\\n([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`,
    "i"
  );
  const match = text.match(regex);

  if (match) {
    const lines = match[1].split("\n");
    for (const line of lines) {
      const cleaned = line.replace(/^[-•*\d.)\s]+/, "").trim();
      if (cleaned.length > 10) {
        items.push(cleaned);
      }
    }
  }

  // Fallback: look for bullet points after the section header
  if (items.length === 0) {
    const headerIdx = text.toLowerCase().indexOf(sectionName.toLowerCase());
    if (headerIdx !== -1) {
      const afterHeader = text.slice(headerIdx);
      const lines = afterHeader.split("\n").slice(1);
      for (const line of lines) {
        const cleaned = line.replace(/^[-•*\d.)\s]+/, "").trim();
        if (cleaned.length > 10 && !cleaned.match(/^[A-Z_]+:/)) {
          items.push(cleaned);
        }
        if (cleaned.match(/^[A-Z_]+:/) && items.length > 0) break;
      }
    }
  }

  return items.slice(0, 5);
}
