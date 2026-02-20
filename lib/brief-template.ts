import { AnalysisJob } from "./types";

// Generates the full HTML for the implementation brief PDF
export function generateBriefHtml(job: AnalysisJob): string {
  const { domain, topic, patternResults, generatedAssets, discoveryResults, domainAnalysis } = job;

  const score = patternResults?.citationProbabilityScore ?? 0;
  const projected = patternResults?.projectedScore ?? 0;
  const gaps = patternResults?.gaps ?? [];
  const archetypes = patternResults?.archetypes ?? [];
  const citedUrls = discoveryResults?.citedUrls ?? [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CiteFix Implementation Brief — ${domain}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.6; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { border-bottom: 3px solid #E74C3C; padding-bottom: 24px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; color: #E74C3C; margin-bottom: 4px; }
    .header .subtitle { font-size: 14px; color: #666; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
    .meta-item { background: #f8f8f8; padding: 12px 16px; border-radius: 6px; }
    .meta-item .label { font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: 1px; }
    .meta-item .value { font-size: 16px; font-weight: 600; margin-top: 4px; }
    h2 { font-size: 22px; color: #1a1a1a; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
    h3 { font-size: 16px; color: #333; margin: 20px 0 8px; }
    .score-box { display: flex; align-items: center; gap: 32px; background: #fef5f4; border: 1px solid #f5c6c0; border-radius: 8px; padding: 24px; margin: 16px 0; }
    .score-number { font-size: 48px; font-weight: 700; }
    .score-current { color: ${score < 40 ? '#E74C3C' : score < 70 ? '#F39C12' : '#27AE60'}; }
    .score-projected { color: #27AE60; }
    .score-arrow { font-size: 24px; color: #27AE60; }
    .gap-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .gap-table th { background: #f0f0f0; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; }
    .gap-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
    .impact-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .impact-high { background: #fde8e8; color: #E74C3C; }
    .impact-medium { background: #fef3cd; color: #856404; }
    .impact-low { background: #d4edda; color: #155724; }
    .difficulty-easy { color: #27AE60; }
    .difficulty-medium { color: #F39C12; }
    .difficulty-hard { color: #E74C3C; }
    .code-block { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 6px; font-family: 'Consolas', 'Courier New', monospace; font-size: 13px; overflow-x: auto; white-space: pre-wrap; margin: 12px 0; }
    .citation-list { list-style: none; }
    .citation-list li { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .citation-url { color: #2980B9; text-decoration: none; font-size: 14px; }
    .citation-count { background: #E74C3C; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px; }
    .section-content { background: #f9f9f9; border: 1px solid #eee; border-radius: 6px; padding: 16px; margin: 12px 0; }
    .checklist li { padding: 4px 0; }
    .checklist li::before { content: "☐ "; color: #E74C3C; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 2px solid #E74C3C; font-size: 12px; color: #999; text-align: center; }
    .archetype-card { background: #f0f7ff; border: 1px solid #b8daff; border-radius: 6px; padding: 16px; margin: 12px 0; }
    .archetype-freq { font-weight: 700; color: #2980B9; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>CiteFix Implementation Brief</h1>
    <div class="subtitle">Answer Engine Optimization — Deployment-Ready Assets</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <div class="label">Target Domain</div>
      <div class="value">${escapeHtml(domain)}</div>
    </div>
    <div class="meta-item">
      <div class="label">Target Topic</div>
      <div class="value">${escapeHtml(topic)}</div>
    </div>
    <div class="meta-item">
      <div class="label">Generated</div>
      <div class="value">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>
    <div class="meta-item">
      <div class="label">Analysis Depth</div>
      <div class="value">${citedUrls.length} pages analyzed</div>
    </div>
  </div>

  <!-- Executive Summary -->
  <h2>1. Executive Summary</h2>
  <p>This implementation brief provides deployment-ready assets to improve <strong>${escapeHtml(domain)}</strong>'s visibility in AI-generated answers for the topic "<strong>${escapeHtml(topic)}</strong>". Based on live citation analysis of ${citedUrls.length} top-cited pages, CiteFix identified ${gaps.length} actionable gaps and generated the fixes needed to close them.</p>

  <div class="score-box">
    <div>
      <div style="font-size: 12px; color: #999; text-transform: uppercase;">Current Score</div>
      <div class="score-number score-current">${score}</div>
    </div>
    <div class="score-arrow">→</div>
    <div>
      <div style="font-size: 12px; color: #999; text-transform: uppercase;">Projected Score</div>
      <div class="score-number score-projected">${projected}</div>
    </div>
    <div style="flex: 1; text-align: right;">
      <div style="font-size: 14px; color: #27AE60; font-weight: 600;">+${projected - score} points</div>
      <div style="font-size: 12px; color: #666;">after implementing all fixes</div>
    </div>
  </div>

  <!-- Citation Analysis -->
  <h2>2. Citation Analysis</h2>
  <p>The following pages are currently being cited by AI engines for "${escapeHtml(topic)}":</p>
  <ul class="citation-list">
    ${citedUrls
      .slice(0, 10)
      .map(
        (u) => `<li>
      <a class="citation-url" href="${escapeHtml(u.url)}">${escapeHtml(u.title || u.url)}</a>
      <span class="citation-count">${u.citationCount}× cited</span>
      <br><span style="font-size: 12px; color: #888;">${escapeHtml(u.url)}</span>
    </li>`
      )
      .join("")}
  </ul>

  ${domainAnalysis?.citationStatus === "cited"
    ? `<p style="color: #27AE60; margin-top: 12px;">✓ Your domain appears in current citations.</p>`
    : `<p style="color: #E74C3C; margin-top: 12px;">✗ Your domain does not currently appear in AI citations for this topic.</p>`
  }

  <!-- Citation Archetypes -->
  <h2>3. Citation Archetypes</h2>
  <p>Top-cited pages cluster into the following structural patterns:</p>
  ${archetypes
    .map(
      (a) => `<div class="archetype-card">
    <h3>${escapeHtml(a.name)} <span class="archetype-freq">(${a.frequency}% of top pages)</span></h3>
    <p style="font-size: 14px; color: #555;">${escapeHtml(a.description)}</p>
  </div>`
    )
    .join("")}

  <!-- Gap Report -->
  <h2>4. Gap Report</h2>
  <table class="gap-table">
    <thead>
      <tr><th>Gap</th><th>Impact</th><th>Difficulty</th><th>Fix Status</th></tr>
    </thead>
    <tbody>
      ${gaps
        .map(
          (g) => `<tr>
        <td><strong>${escapeHtml(g.name)}</strong><br><span style="font-size: 12px; color: #666;">${escapeHtml(g.description)}</span></td>
        <td><span class="impact-badge ${g.impactScore > 0.3 ? "impact-high" : g.impactScore > 0.2 ? "impact-medium" : "impact-low"}">+${(g.impactScore * 100).toFixed(0)}%</span></td>
        <td class="difficulty-${g.difficulty}">${g.difficulty}</td>
        <td>${g.assetGenerated ? "✓ Generated" : "—"}</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <!-- Generated Schema Markup -->
  ${
    generatedAssets?.schemaMarkup
      ? `<h2>5. Schema Markup (JSON-LD)</h2>
  <p>Copy and paste this into your page's <code>&lt;head&gt;</code> section:</p>
  <div class="code-block">${escapeHtml(generatedAssets.schemaMarkup.jsonLd)}</div>
  <p style="font-size: 12px; color: #666;">Schema types: ${generatedAssets.schemaMarkup.types.join(", ")}</p>`
      : ""
  }

  <!-- Rewritten Copy -->
  ${
    generatedAssets?.rewrittenCopy
      ? `<h2>6. Rewritten Page Copy</h2>
  <p style="font-size: 12px; color: #666;">${generatedAssets.rewrittenCopy.wordCount} words — structured to match the winning citation archetype</p>
  <div class="section-content">${escapeHtml(generatedAssets.rewrittenCopy.markdown).replace(/\n/g, "<br>")}</div>`
      : ""
  }

  <!-- Content Sections -->
  ${
    generatedAssets?.contentSections && generatedAssets.contentSections.length > 0
      ? `<h2>7. Generated Content Sections</h2>
  ${generatedAssets.contentSections
    .map(
      (s) => `<h3>${escapeHtml(s.title)} (${s.type})</h3>
  <div class="section-content">${s.html || escapeHtml(s.markdown).replace(/\n/g, "<br>")}</div>`
    )
    .join("")}`
      : ""
  }

  <!-- Implementation Checklist -->
  <h2>8. Implementation Checklist</h2>
  <ul class="checklist">
    ${gaps.filter((g) => g.assetGenerated).map((g) => `<li>${escapeHtml(g.name)} — see generated asset above</li>`).join("")}
    <li>Add JSON-LD schema to page &lt;head&gt;</li>
    <li>Replace page content with rewritten copy</li>
    <li>Add FAQ section to page body</li>
    <li>Update internal link structure</li>
    <li>Verify schema with Schema.org validator</li>
    <li>Re-run CiteFix analysis to verify improvement</li>
  </ul>

  <div class="footer">
    <p>Generated by <strong>CiteFix</strong> — Powered by You.com APIs & Foxit PDF</p>
    <p>DeveloperWeek 2026 Hackathon</p>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
