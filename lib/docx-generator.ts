import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  ExternalHyperlink,
  Footer,
  PageNumber,
  NumberFormat,
} from "docx";
import { AnalysisJob } from "./types";

const BRAND_COLOR = "E74C3C";
const GREEN = "27AE60";
const GRAY = "666666";

export async function generateBriefDocx(job: AnalysisJob): Promise<Buffer> {
  const { domain, topic, patternResults, generatedAssets, discoveryResults, domainAnalysis } = job;

  const score = patternResults?.citationProbabilityScore ?? 0;
  const projected = patternResults?.projectedScore ?? 0;
  const gaps = patternResults?.gaps ?? [];
  const archetypes = patternResults?.archetypes ?? [];
  const citedUrls = discoveryResults?.citedUrls ?? [];

  const sections: Paragraph[] = [];

  // Title
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: "CiteFix Implementation Brief", bold: true, size: 48, color: BRAND_COLOR, font: "Segoe UI" }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Answer Engine Optimization — Deployment-Ready Assets", size: 22, color: GRAY, font: "Segoe UI" }),
      ],
      spacing: { after: 400 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_COLOR } },
    })
  );

  // Meta info
  const metaItems = [
    ["Target Domain", domain],
    ["Target Topic", topic],
    ["Generated", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
    ["Pages Analyzed", `${citedUrls.length} pages`],
  ];

  for (const [label, value] of metaItems) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, size: 20, color: GRAY, font: "Segoe UI" }),
          new TextRun({ text: value, size: 20, bold: true, font: "Segoe UI" }),
        ],
        spacing: { after: 80 },
      })
    );
  }
  sections.push(new Paragraph({ spacing: { after: 200 } }));

  // 1. Executive Summary
  sections.push(heading("1. Executive Summary"));
  sections.push(
    bodyText(
      `This implementation brief provides deployment-ready assets to improve ${domain}'s visibility in AI-generated answers for the topic "${topic}". Based on live citation analysis of ${citedUrls.length} top-cited pages, CiteFix identified ${gaps.length} actionable gaps and generated the fixes needed to close them.`
    )
  );

  // Score box
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Current Score: ", size: 24, color: GRAY, font: "Segoe UI" }),
        new TextRun({ text: `${score}`, size: 40, bold: true, color: score < 40 ? BRAND_COLOR : score < 70 ? "F39C12" : GREEN, font: "Segoe UI" }),
        new TextRun({ text: "  →  ", size: 24, color: GREEN, font: "Segoe UI" }),
        new TextRun({ text: "Projected: ", size: 24, color: GRAY, font: "Segoe UI" }),
        new TextRun({ text: `${projected}`, size: 40, bold: true, color: GREEN, font: "Segoe UI" }),
        new TextRun({ text: `  (+${projected - score} points)`, size: 22, color: GREEN, font: "Segoe UI" }),
      ],
      spacing: { before: 200, after: 300 },
      shading: { type: ShadingType.SOLID, color: "FEF5F4" },
    })
  );

  // 2. Citation Analysis
  sections.push(heading("2. Citation Analysis"));
  sections.push(bodyText(`The following pages are currently being cited by AI engines for "${topic}":`));

  for (const u of citedUrls.slice(0, 10)) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: `• `, size: 20, font: "Segoe UI" }),
          new ExternalHyperlink({
            children: [new TextRun({ text: u.title || u.url, style: "Hyperlink", size: 20, font: "Segoe UI" })],
            link: u.url,
          }),
          new TextRun({ text: ` (${u.citationCount}× cited)`, size: 18, color: BRAND_COLOR, font: "Segoe UI" }),
        ],
        spacing: { after: 60 },
      })
    );
  }

  if (domainAnalysis) {
    const statusText = domainAnalysis.citationStatus === "cited"
      ? "✓ Your domain appears in current citations."
      : "✗ Your domain does not currently appear in AI citations for this topic.";
    const statusColor = domainAnalysis.citationStatus === "cited" ? GREEN : BRAND_COLOR;
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: statusText, size: 20, color: statusColor, font: "Segoe UI" })],
        spacing: { before: 100, after: 200 },
      })
    );
  }

  // 3. Citation Archetypes
  sections.push(heading("3. Citation Archetypes"));
  sections.push(bodyText("Top-cited pages cluster into the following structural patterns:"));

  for (const a of archetypes) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: a.name, bold: true, size: 22, font: "Segoe UI" }),
          new TextRun({ text: ` (${a.frequency}% of top pages)`, size: 20, color: "2980B9", font: "Segoe UI" }),
        ],
        spacing: { before: 120, after: 40 },
      }),
      new Paragraph({
        children: [new TextRun({ text: a.description, size: 20, color: "555555", font: "Segoe UI" })],
        spacing: { after: 120 },
      })
    );
  }

  // 4. Gap Report
  sections.push(heading("4. Gap Report"));

  if (gaps.length > 0) {
    const headerRow = new TableRow({
      tableHeader: true,
      children: ["Gap", "Impact", "Score", "Difficulty", "Fix Status"].map(
        (text) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, color: GRAY, font: "Segoe UI" })] })],
            shading: { type: ShadingType.SOLID, color: "F0F0F0" },
          })
      ),
    });

    const dataRows = gaps.map(
      (g) =>
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: g.name, bold: true, size: 20, font: "Segoe UI" })] }),
                new Paragraph({ children: [new TextRun({ text: g.description, size: 18, color: GRAY, font: "Segoe UI" })] }),
                ...(g.beforeState && g.afterState ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "BEFORE: ", bold: true, size: 16, color: BRAND_COLOR, font: "Segoe UI" }),
                      new TextRun({ text: g.beforeState, size: 16, color: GRAY, font: "Segoe UI" }),
                    ],
                    spacing: { before: 60 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "AFTER: ", bold: true, size: 16, color: GREEN, font: "Segoe UI" }),
                      new TextRun({ text: g.afterState, size: 16, color: GRAY, font: "Segoe UI" }),
                    ],
                  }),
                ] : []),
              ],
              width: { size: 40, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `+${(g.impactScore * 100).toFixed(0)}%`, size: 20, color: g.impactScore > 0.3 ? BRAND_COLOR : "856404", font: "Segoe UI" })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: g.scoreImpact ? `+${g.scoreImpact} pts` : "—", size: 20, color: GREEN, bold: true, font: "Segoe UI" })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: g.difficulty, size: 20, color: g.difficulty === "easy" ? GREEN : g.difficulty === "medium" ? "F39C12" : BRAND_COLOR, font: "Segoe UI" })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: g.assetGenerated ? "✓ Generated" : "—", size: 20, font: "Segoe UI" })] })],
            }),
          ],
        })
    );

    sections.push(
      new Paragraph({ spacing: { after: 100 } })
    );

    const gapTable = new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    });

    // Tables need to be in the document children directly, not wrapped in paragraphs
    // We'll handle this by building the document structure differently
    sections.push(gapTable as unknown as Paragraph); // We'll fix this in the document assembly
  }

  // 5. Schema Markup
  if (generatedAssets?.schemaMarkup) {
    sections.push(heading("5. Schema Markup (JSON-LD)"));
    sections.push(bodyText('Copy and paste this into your page\'s <head> section:'));
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: generatedAssets.schemaMarkup.jsonLd, size: 18, font: "Consolas" })],
        spacing: { before: 100, after: 100 },
        shading: { type: ShadingType.SOLID, color: "F5F5F5" },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Schema types: ${generatedAssets.schemaMarkup.types.join(", ")}`, size: 18, color: GRAY, font: "Segoe UI" })],
        spacing: { after: 200 },
      })
    );
  }

  // 6. Rewritten Copy
  if (generatedAssets?.rewrittenCopy) {
    sections.push(heading("6. Rewritten Page Copy"));
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `${generatedAssets.rewrittenCopy.wordCount} words — structured to match the winning citation archetype`, size: 18, color: GRAY, font: "Segoe UI" })],
        spacing: { after: 100 },
      })
    );

    // Split the markdown into paragraphs
    const lines = generatedAssets.rewrittenCopy.markdown.split("\n").filter((l) => l.trim());
    for (const line of lines.slice(0, 100)) {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: trimmed.replace(/^#+\s*/, ""), bold: true, size: 28, font: "Segoe UI" })],
          spacing: { before: 160, after: 80 },
        }));
      } else if (trimmed.startsWith("## ")) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: trimmed.replace(/^#+\s*/, ""), bold: true, size: 24, font: "Segoe UI" })],
          spacing: { before: 140, after: 60 },
        }));
      } else if (trimmed.startsWith("### ")) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: trimmed.replace(/^#+\s*/, ""), bold: true, size: 22, font: "Segoe UI" })],
          spacing: { before: 120, after: 40 },
        }));
      } else {
        sections.push(bodyText(trimmed.replace(/\*\*/g, "").replace(/\*/g, "")));
      }
    }
  }

  // 7. Content Sections
  if (generatedAssets?.contentSections && generatedAssets.contentSections.length > 0) {
    sections.push(heading("7. Generated Content Sections"));
    for (const s of generatedAssets.contentSections) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${s.type.toUpperCase()}] `, size: 18, color: "2980B9", bold: true, font: "Segoe UI" }),
            new TextRun({ text: s.title, bold: true, size: 22, font: "Segoe UI" }),
          ],
          spacing: { before: 120, after: 60 },
        })
      );
      const contentLines = s.markdown.split("\n").filter((l) => l.trim());
      for (const line of contentLines.slice(0, 50)) {
        sections.push(bodyText(line.replace(/\*\*/g, "").replace(/\*/g, "").replace(/^#+\s*/, "")));
      }
    }
  }

  // 8. Internal Link Recommendations
  if (generatedAssets?.internalLinks?.recommendations && generatedAssets.internalLinks.recommendations.length > 0) {
    sections.push(heading("8. Internal Link Recommendations"));
    for (const link of generatedAssets.internalLinks.recommendations) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• "${link.anchorText}"`, bold: true, size: 20, font: "Segoe UI" }),
            new TextRun({ text: ` — ${link.reason}`, size: 20, color: GRAY, font: "Segoe UI" }),
          ],
          spacing: { after: 60 },
        })
      );
    }
  }

  // 9. Advanced Research Insights
  if (job.advancedResearch) {
    sections.push(heading("9. Advanced Research Insights"));
    sections.push(bodyText("Deep research powered by You.com Advanced Agent API — uncovering contradictions, knowledge gaps, and content opportunities."));

    if (job.advancedResearch.contradictions.length > 0) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: "⚠ Contradictions Found", bold: true, size: 24, color: "E67E22", font: "Segoe UI" })],
          spacing: { before: 160, after: 80 },
        })
      );
      for (const c of job.advancedResearch.contradictions) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${c}`, size: 20, font: "Segoe UI" })],
            spacing: { after: 60 },
          })
        );
      }
    }

    if (job.advancedResearch.knowledgeGaps.length > 0) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: "◉ Knowledge Gaps in Current Citations", bold: true, size: 24, color: "F39C12", font: "Segoe UI" })],
          spacing: { before: 160, after: 80 },
        })
      );
      for (const g of job.advancedResearch.knowledgeGaps) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${g}`, size: 20, font: "Segoe UI" })],
            spacing: { after: 60 },
          })
        );
      }
    }

    if (job.advancedResearch.contentOpportunities.length > 0) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: "★ Content Opportunities", bold: true, size: 24, color: GREEN, font: "Segoe UI" })],
          spacing: { before: 160, after: 80 },
        })
      );
      for (const o of job.advancedResearch.contentOpportunities) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${o}`, size: 20, font: "Segoe UI" })],
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  // 10. API Transparency
  if (job.apiTracking) {
    sections.push(heading("10. Analysis Methodology"));
    const apisUsed = [...new Set(job.apiTracking.calls.map(c => c.api))].join(', ');
    sections.push(bodyText(`APIs Used: ${apisUsed}`));
    sections.push(bodyText(`Total API Calls: ${job.apiTracking.totalCalls}`));
    sections.push(bodyText(`Analysis Duration: ${(job.apiTracking.totalDurationMs / 1000).toFixed(1)}s`));
    if (job.discoveryResults?.queryVariants) {
      sections.push(bodyText(`Query Variants: ${job.discoveryResults.queryVariants.join(' • ')}`));
    }
  }

  // Implementation Checklist
  sections.push(heading("11. Implementation Checklist"));
  const checklistItems = [
    ...gaps.filter((g) => g.assetGenerated).map((g) => `${g.name} — see generated asset above`),
    "Add JSON-LD schema to page <head>",
    "Replace page content with rewritten copy",
    "Add FAQ section to page body",
    "Update internal link structure",
    "Verify schema with Schema.org validator",
    "Re-run CiteFix analysis to verify improvement",
  ];
  for (const item of checklistItems) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `☐ ${item}`, size: 20, font: "Segoe UI" })],
        spacing: { after: 60 },
      })
    );
  }

  // Build document — separate Paragraph and Table children
  const docChildren: (Paragraph | Table)[] = [];
  for (const item of sections) {
    if (item instanceof Table) {
      docChildren.push(item);
    } else {
      docChildren.push(item);
    }
  }

  const doc = new Document({
    creator: "CiteFix",
    title: `CiteFix Implementation Brief — ${domain}`,
    description: `AEO analysis and implementation brief for ${domain}`,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        children: docChildren,
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Generated by CiteFix — Powered by You.com APIs & Foxit PDF  |  Page ", size: 16, color: GRAY, font: "Segoe UI" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY, font: "Segoe UI" }),
                ],
              }),
            ],
          }),
        },
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

function heading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, font: "Segoe UI" })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" } },
  });
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, font: "Segoe UI" })],
    spacing: { after: 100 },
  });
}
