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
  <title>Scoutlytics Implementation Brief — ${domain}</title>
  <style>
    @page {
      size: letter;
      margin: 60px 50px 50px 50px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      max-width: 680px;
      margin: 0 auto;
      padding: 0 24px;
      font-size: 13px;
    }

    /* Static page header — repeated manually per section */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 2px solid #E8834A;
      margin-bottom: 20px;
    }
    .section-header .logo-text {
      font-size: 13px;
      font-weight: 700;
      color: #E8834A;
      letter-spacing: 0.5px;
    }
    .section-header .doc-info {
      font-size: 9px;
      color: #999;
      text-align: right;
      line-height: 1.4;
    }

    /* Cover section */
    .cover {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 80vh;
      text-align: center;
      padding: 40px 10px;
    }
    .cover .brand-mark {
      display: inline-block;
      width: 56px;
      height: 56px;
      background: #E8834A;
      border-radius: 8px;
      margin: 0 auto 24px;
      position: relative;
    }
    .cover .brand-mark::after {
      content: "◆";
      color: white;
      font-size: 24px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .cover h1 {
      font-size: 32px;
      color: #1a1a1a;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .cover .doc-type {
      font-size: 14px;
      color: #E8834A;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 32px;
    }
    .cover .cover-meta {
      display: inline-block;
      text-align: left;
      background: #f8f8f8;
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 20px 32px;
      margin: 0 auto;
    }
    .cover .cover-meta-row {
      display: flex;
      gap: 12px;
      padding: 5px 0;
      font-size: 13px;
    }
    .cover .cover-meta-label {
      color: #999;
      min-width: 110px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding-top: 2px;
    }
    .cover .cover-meta-value { color: #1a1a1a; font-weight: 600; }
    .cover .cover-divider {
      width: 50px;
      height: 3px;
      background: #E8834A;
      margin: 24px auto;
    }
    .cover .cover-footer {
      font-size: 10px;
      color: #bbb;
      margin-top: 32px;
    }

    /* Main content area */
    .main-content { padding-top: 10px; }
    h2 {
      font-size: 18px;
      color: #1a1a1a;
      margin: 28px 0 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #E8834A;
    }
    h3 { font-size: 14px; color: #333; margin: 18px 0 8px; }
    p { margin-bottom: 10px; font-size: 13px; }

    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0; }
    .meta-item { background: #f8f8f8; padding: 12px 14px; border-radius: 6px; border-left: 3px solid #E8834A; }
    .meta-item .label { font-size: 9px; text-transform: uppercase; color: #999; letter-spacing: 1px; font-weight: 600; }
    .meta-item .value { font-size: 15px; font-weight: 700; margin-top: 3px; color: #1a1a1a; }

    .score-box {
      display: flex;
      align-items: center;
      gap: 24px;
      background: linear-gradient(135deg, #fef5f4 0%, #fff 100%);
      border: 1px solid #f5c6c0;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
    }
    .score-number { font-size: 40px; font-weight: 800; }
    .score-current { color: ${score < 40 ? '#E8834A' : score < 70 ? '#F39C12' : '#27AE60'}; }
    .score-projected { color: #27AE60; }
    .score-arrow { font-size: 24px; color: #27AE60; }

    .gap-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
    .gap-table th { background: #f0f0f0; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; border-bottom: 2px solid #ddd; }
    .gap-table td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 12px; vertical-align: top; }
    .gap-table tr:nth-child(even) { background: #fafafa; }

    .impact-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
    .impact-high { background: #fde8e8; color: #E8834A; }
    .impact-medium { background: #fef3cd; color: #856404; }
    .impact-low { background: #d4edda; color: #155724; }
    .difficulty-easy { color: #27AE60; font-weight: 600; }
    .difficulty-medium { color: #F39C12; font-weight: 600; }
    .difficulty-hard { color: #E8834A; font-weight: 600; }

    .code-block {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 14px;
      border-radius: 6px;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 10px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
      word-break: break-all;
      overflow-wrap: break-word;
      margin: 10px 0;
      border: 1px solid #333;
    }

    .citation-list { list-style: none; }
    .citation-list li { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .citation-url { color: #2980B9; text-decoration: none; font-size: 13px; font-weight: 500; word-break: break-all; }
    .citation-count { background: #E8834A; color: white; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; margin-left: 6px; }

    .section-content {
      background: #f9f9f9;
      border: 1px solid #eee;
      border-radius: 6px;
      padding: 16px;
      margin: 10px 0;
      font-size: 13px;
      line-height: 1.6;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .checklist { list-style: none; padding: 0; }
    .checklist li { padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
    .checklist li::before { content: "☐ "; color: #E8834A; font-weight: 700; }

    .archetype-card { background: #f0f7ff; border: 1px solid #b8daff; border-radius: 6px; padding: 14px; margin: 10px 0; }
    .archetype-freq { font-weight: 700; color: #2980B9; }

    .toc { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 18px 22px; margin: 20px 0 28px; }
    .toc h2 { margin: 0 0 10px; font-size: 16px; color: #333; border: none; padding: 0; }
    .toc ol { counter-reset: toc-counter; list-style: none; margin: 0; padding: 0; }
    .toc li { counter-increment: toc-counter; padding: 5px 0; border-bottom: 1px dotted #ddd; }
    .toc li:last-child { border-bottom: none; }
    .toc a { color: #2980B9; text-decoration: none; font-size: 13px; }
    .toc a::before { content: counter(toc-counter) ". "; color: #999; font-weight: 600; }

    .doc-footer { margin-top: 36px; padding: 18px 0 12px; border-top: 3px solid #E8834A; font-size: 11px; color: #999; text-align: center; }
    .doc-footer strong { color: #E8834A; }

    .section-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0 0;
      border-top: 1px solid #eee;
      margin-top: 24px;
      font-size: 8px;
      color: #ccc;
    }
    .section-footer .confidential {
      color: #E8834A;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Page breaks for clean sections */
    .page-break { page-break-before: always; }

    @media print {
      body { padding: 0; max-width: 100%; }
      .cover { min-height: 85vh; }
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover">
    <div class="brand-mark"></div>
    <h1>Scoutlytics</h1>
    <div class="doc-type">Implementation Brief</div>
    <div class="cover-divider"></div>
    <div class="cover-meta">
      <div class="cover-meta-row">
        <span class="cover-meta-label">Domain</span>
        <span class="cover-meta-value">${escapeHtml(domain)}</span>
      </div>
      <div class="cover-meta-row">
        <span class="cover-meta-label">Topic</span>
        <span class="cover-meta-value">${escapeHtml(topic)}</span>
      </div>
      <div class="cover-meta-row">
        <span class="cover-meta-label">Date</span>
        <span class="cover-meta-value">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
      </div>
      <div class="cover-meta-row">
        <span class="cover-meta-label">Pages Analyzed</span>
        <span class="cover-meta-value">${citedUrls.length} pages</span>
      </div>
      <div class="cover-meta-row">
        <span class="cover-meta-label">Gaps Found</span>
        <span class="cover-meta-value" style="color: #E8834A;">${gaps.length} actionable gaps</span>
      </div>
    </div>
    <div class="cover-footer">
      Answer Engine Optimization · Deployment-Ready Assets<br>
      Powered by You.com APIs &amp; Foxit PDF Services
    </div>
  </div>

  <!-- Main Content -->
  <div class="main-content">

  <!-- Section header -->
  <div class="section-header">
    <span class="logo-text">◆ SCOUTLYTICS</span>
    <span class="doc-info">Implementation Brief — ${escapeHtml(domain)}<br>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
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
      <div class="label">Report Date</div>
      <div class="value">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>
    <div class="meta-item">
      <div class="label">Analysis Depth</div>
      <div class="value">${citedUrls.length} pages analyzed</div>
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="toc">
    <h2>Table of Contents</h2>
    <ol>
      <li><a href="#executive-summary">Executive Summary</a></li>
      <li><a href="#citation-analysis">Citation Analysis</a></li>
      <li><a href="#citation-archetypes">Citation Archetypes</a></li>
      <li><a href="#gap-report">Gap Report</a></li>
      ${generatedAssets?.schemaMarkup ? '<li><a href="#schema-markup">Schema Markup (JSON-LD)</a></li>' : ''}
      ${generatedAssets?.rewrittenCopy ? '<li><a href="#rewritten-copy">Rewritten Page Copy</a></li>' : ''}
      ${generatedAssets?.contentSections && generatedAssets.contentSections.length > 0 ? '<li><a href="#content-sections">Generated Content Sections</a></li>' : ''}
      ${generatedAssets?.internalLinks?.recommendations && generatedAssets.internalLinks.recommendations.length > 0 ? '<li><a href="#link-recommendations">Internal Link Recommendations</a></li>' : ''}
      ${job.advancedResearch ? '<li><a href="#research-insights">Advanced Research Insights</a></li>' : ''}
      ${job.apiTracking ? '<li><a href="#methodology">Analysis Methodology</a></li>' : ''}
      <li><a href="#checklist">Implementation Checklist</a></li>
    </ol>
  </div>

  <!-- Executive Summary -->
  <h2 id="executive-summary">1. Executive Summary</h2>
  <p>This implementation brief provides deployment-ready assets to improve <strong>${escapeHtml(domain)}</strong>'s visibility in AI-generated answers for the topic "<strong>${escapeHtml(topic)}</strong>". Based on live citation analysis of ${citedUrls.length} top-cited pages, Scoutlytics identified ${gaps.length} actionable gaps and generated the fixes needed to close them.</p>

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
  <h2 id="citation-analysis">2. Citation Analysis</h2>
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
    : `<p style="color: #E8834A; margin-top: 12px;">✗ Your domain does not currently appear in AI citations for this topic.</p>`
  }

  <!-- Citation Archetypes -->
  <h2 id="citation-archetypes">3. Citation Archetypes</h2>
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
  <div class="section-footer">
    <span class="confidential">Confidential</span>
    <span>Generated by Scoutlytics · Powered by You.com APIs &amp; Foxit PDF</span>
    <span>scoutlytics.xyz</span>
  </div>
  <div class="page-break"></div>
  <div class="section-header">
    <span class="logo-text">◆ SCOUTLYTICS</span>
    <span class="doc-info">Implementation Brief — ${escapeHtml(domain)}<br>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
  </div>
  <h2 id="gap-report">4. Gap Report</h2>
  <table class="gap-table">
    <thead>
      <tr><th>Gap</th><th>Impact</th><th>Score Impact</th><th>Difficulty</th><th>Fix Status</th></tr>
    </thead>
    <tbody>
      ${gaps
        .map(
          (g) => `<tr>
        <td>
          <strong>${escapeHtml(g.name)}</strong><br>
          <span style="font-size: 12px; color: #666;">${escapeHtml(g.description)}</span>
          ${g.beforeState && g.afterState ? `
          <div style="margin-top: 6px;">
            <div style="background: #fde8e8; padding: 4px 8px; border-radius: 4px; font-size: 10px; margin-bottom: 4px; word-wrap: break-word;">
              <strong style="color: #E8834A;">BEFORE:</strong> ${escapeHtml(g.beforeState)}
            </div>
            <div style="background: #d4edda; padding: 4px 8px; border-radius: 4px; font-size: 10px; word-wrap: break-word;">
              <strong style="color: #27AE60;">AFTER:</strong> ${escapeHtml(g.afterState)}
            </div>
          </div>` : ''}
        </td>
        <td><span class="impact-badge ${g.impactScore > 0.3 ? "impact-high" : g.impactScore > 0.2 ? "impact-medium" : "impact-low"}">+${(g.impactScore * 100).toFixed(0)}%</span></td>
        <td style="color: #27AE60; font-weight: 600;">${g.scoreImpact ? `+${g.scoreImpact} pts` : '—'}</td>
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
      ? `<div class="section-footer">
    <span class="confidential">Confidential</span>
    <span>Generated by Scoutlytics · Powered by You.com APIs &amp; Foxit PDF</span>
    <span>scoutlytics.xyz</span>
  </div>
  <div class="page-break"></div>
  <div class="section-header">
    <span class="logo-text">◆ SCOUTLYTICS</span>
    <span class="doc-info">Implementation Brief — ${escapeHtml(domain)}<br>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
  </div>
  <h2 id="schema-markup">5. Schema Markup (JSON-LD)</h2>
  <p>Copy and paste this into your page's <code>&lt;head&gt;</code> section:</p>
  <div class="code-block">${escapeHtml(generatedAssets.schemaMarkup.jsonLd)}</div>
  <p style="font-size: 11px; color: #666;">Schema types: ${generatedAssets.schemaMarkup.types.join(", ")}</p>`
      : ""
  }

  <!-- Rewritten Copy -->
  ${
    generatedAssets?.rewrittenCopy
      ? `<h2 id="rewritten-copy">6. Rewritten Page Copy</h2>
  <p style="font-size: 11px; color: #666;">${generatedAssets.rewrittenCopy.wordCount} words — structured to match the winning citation archetype</p>
  <div class="section-content">${escapeHtml(generatedAssets.rewrittenCopy.markdown).replace(/\n/g, "<br>")}</div>`
      : ""
  }

  <!-- Content Sections -->
  ${
    generatedAssets?.contentSections && generatedAssets.contentSections.length > 0
      ? `<h2 id="content-sections">7. Generated Content Sections</h2>
  ${generatedAssets.contentSections
    .map(
      (s) => `<h3>${escapeHtml(s.title)} (${s.type})</h3>
  <div class="section-content">${s.html || escapeHtml(s.markdown).replace(/\n/g, "<br>")}</div>`
    )
    .join("")}`
      : ""
  }

  <!-- Internal Link Recommendations -->
  ${
    generatedAssets?.internalLinks?.recommendations && generatedAssets.internalLinks.recommendations.length > 0
      ? `<h2 id="link-recommendations">8. Internal Link Recommendations</h2>
  <ul>
  ${generatedAssets.internalLinks.recommendations
    .map(
      (link) => `<li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
        <strong>"${escapeHtml(link.anchorText)}"</strong> → <span style="color: #2980B9;">${escapeHtml(link.toPage)}</span>
        <br><span style="font-size: 12px; color: #666;">${escapeHtml(link.reason)}</span>
      </li>`
    )
    .join("")}
  </ul>`
      : ""
  }

  <!-- Advanced Research Insights -->
  ${job.advancedResearch ? `
  <div class="section-footer">
    <span class="confidential">Confidential</span>
    <span>Generated by Scoutlytics · Powered by You.com APIs &amp; Foxit PDF</span>
    <span>scoutlytics.xyz</span>
  </div>
  <div class="page-break"></div>
  <div class="section-header">
    <span class="logo-text">◆ SCOUTLYTICS</span>
    <span class="doc-info">Implementation Brief — ${escapeHtml(domain)}<br>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
  </div>
  <h2 id="research-insights">9. Advanced Research Insights</h2>
  <p style="font-size: 13px; color: #666;">Deep research powered by You.com Advanced Agent API — uncovering contradictions, knowledge gaps, and content opportunities.</p>

  ${job.advancedResearch.contradictions.length > 0 ? `
  <h3 style="color: #E67E22;">⚠ Contradictions Found</h3>
  <ul style="margin: 8px 0 16px;">
    ${job.advancedResearch.contradictions.map(c => `<li style="padding: 4px 0; font-size: 14px;">${escapeHtml(c)}</li>`).join('')}
  </ul>` : ''}

  ${job.advancedResearch.knowledgeGaps.length > 0 ? `
  <h3 style="color: #F39C12;">◉ Knowledge Gaps in Current Citations</h3>
  <ul style="margin: 8px 0 16px;">
    ${job.advancedResearch.knowledgeGaps.map(g => `<li style="padding: 4px 0; font-size: 14px;">${escapeHtml(g)}</li>`).join('')}
  </ul>` : ''}

  ${job.advancedResearch.contentOpportunities.length > 0 ? `
  <h3 style="color: #27AE60;">★ Content Opportunities</h3>
  <ul style="margin: 8px 0 16px;">
    ${job.advancedResearch.contentOpportunities.map(o => `<li style="padding: 4px 0; font-size: 14px;">${escapeHtml(o)}</li>`).join('')}
  </ul>` : ''}
  ` : ''}

  <!-- API Transparency -->
  ${job.apiTracking ? `
  <h2 id="methodology">10. Analysis Methodology</h2>
  <div style="background: #f0f7ff; border: 1px solid #b8daff; border-radius: 6px; padding: 16px; margin: 12px 0;">
    <p style="font-size: 13px; margin-bottom: 8px;"><strong>APIs Used:</strong> ${[...new Set(job.apiTracking.calls.map(c => c.api))].join(', ')}</p>
    <p style="font-size: 13px; margin-bottom: 8px;"><strong>Total API Calls:</strong> ${job.apiTracking.totalCalls}</p>
    <p style="font-size: 13px; margin-bottom: 8px;"><strong>Analysis Duration:</strong> ${(job.apiTracking.totalDurationMs / 1000).toFixed(1)}s</p>
    ${job.discoveryResults?.queryVariants ? `<p style="font-size: 13px;"><strong>Query Variants:</strong> ${job.discoveryResults.queryVariants.join(' • ')}</p>` : ''}
  </div>
  ` : ''}

  <!-- Implementation Checklist -->
  <div class="section-footer">
    <span class="confidential">Confidential</span>
    <span>Generated by Scoutlytics · Powered by You.com APIs &amp; Foxit PDF</span>
    <span>scoutlytics.xyz</span>
  </div>
  <div class="page-break"></div>
  <div class="section-header">
    <span class="logo-text">◆ SCOUTLYTICS</span>
    <span class="doc-info">Implementation Brief — ${escapeHtml(domain)}<br>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
  </div>
  <h2 id="checklist">11. Implementation Checklist</h2>
  <ul class="checklist">
    ${gaps.filter((g) => g.assetGenerated).map((g) => `<li>${escapeHtml(g.name)} — see generated asset above</li>`).join("")}
    <li>Add JSON-LD schema to page &lt;head&gt;</li>
    <li>Replace page content with rewritten copy</li>
    <li>Add FAQ section to page body</li>
    <li>Update internal link structure</li>
    <li>Verify schema with Schema.org validator</li>
    <li>Re-run Scoutlytics analysis to verify improvement</li>
  </ul>

  <div class="doc-footer">
    <p style="margin-bottom: 4px;">Generated by <strong>Scoutlytics</strong> — Powered by You.com APIs &amp; Foxit PDF Services</p>
    <p style="margin-bottom: 4px;">DeveloperWeek 2026 Hackathon</p>
    <p style="color: #ccc; font-size: 9px;">scoutlytics.xyz</p>
  </div>
  </div> <!-- end main-content -->
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
