import {
  ExtractedPage,
  DomainAnalysis,
  PatternResults,
  CitationArchetype,
  GapItem,
  StructuralSignal,
} from "./types";

// Analyze the user's domain page
export function analyzeDomain(
  page: ExtractedPage,
  isCited: boolean
): DomainAnalysis {
  const existingSchemaTypes = page.schemaMarkup.map((s) => s.type);

  return {
    page,
    existingSchemaTypes,
    hasFaq: page.faqSections.length > 0,
    contentDepth: scoreContentDepth(page),
    headingScore: scoreHeadings(page),
    citationStatus: isCited ? "cited" : "not_cited",
  };
}

// Core pattern analysis — compares top-cited pages against user's domain
export function analyzePatterns(
  citedPages: ExtractedPage[],
  domainAnalysis: DomainAnalysis
): PatternResults {
  const archetypes = identifyArchetypes(citedPages);
  const gaps = identifyGaps(citedPages, domainAnalysis);
  const currentScore = calculateCitationScore(domainAnalysis);
  const projectedScore = projectImprovedScore(currentScore, gaps);

  const bestArchetype = archetypes[0];
  const userArchetypeMatch = bestArchetype
    ? calculateArchetypeMatch(domainAnalysis, bestArchetype)
    : 0;

  return {
    archetypes,
    gaps,
    citationProbabilityScore: currentScore,
    projectedScore,
    userArchetypeMatch,
  };
}

function identifyArchetypes(pages: ExtractedPage[]): CitationArchetype[] {
  const archetypes: CitationArchetype[] = [];
  let authorityCount = 0;
  let faqHeavyCount = 0;
  let deepContentCount = 0;

  for (const page of pages) {
    const hasSchema = page.schemaMarkup.length > 0;
    const hasFaq = page.faqSections.length >= 3;
    const isDeep = page.wordCount > 1500;
    const hasStrongHeadings = page.headings.length >= 5;

    if (hasSchema && hasStrongHeadings && isDeep) authorityCount++;
    if (hasFaq) faqHeavyCount++;
    if (isDeep && hasStrongHeadings) deepContentCount++;
  }

  const total = pages.length || 1;

  if (authorityCount > 0) {
    archetypes.push({
      name: "Authority Hub with Schema",
      description:
        "Pages with structured schema markup, strong heading hierarchy, and comprehensive content depth.",
      frequency: Math.round((authorityCount / total) * 100),
      signals: [
        { name: "JSON-LD Schema", present: true, score: 0.9 },
        { name: "Deep heading hierarchy", present: true, score: 0.85 },
        { name: "1500+ word content", present: true, score: 0.8 },
      ],
    });
  }

  if (faqHeavyCount > 0) {
    archetypes.push({
      name: "FAQ-Rich Content Page",
      description:
        "Pages featuring extensive Q&A sections that directly answer user queries — highly favored by AI engines.",
      frequency: Math.round((faqHeavyCount / total) * 100),
      signals: [
        { name: "FAQ sections (3+)", present: true, score: 0.88 },
        { name: "Question-answer format", present: true, score: 0.82 },
        { name: "Direct answer snippets", present: true, score: 0.75 },
      ],
    });
  }

  if (deepContentCount > 0) {
    archetypes.push({
      name: "Deep Comparison Article",
      description:
        "Comprehensive comparison content with detailed analysis, multiple product/option coverage, and expert tone.",
      frequency: Math.round((deepContentCount / total) * 100),
      signals: [
        { name: "Comparative structure", present: true, score: 0.85 },
        { name: "Multiple H2/H3 sections", present: true, score: 0.8 },
        { name: "High word count", present: true, score: 0.78 },
      ],
    });
  }

  // Ensure at least one archetype
  if (archetypes.length === 0) {
    archetypes.push({
      name: "General Content Page",
      description: "Standard content page without distinctive structural patterns.",
      frequency: 100,
      signals: [
        { name: "Basic content structure", present: true, score: 0.5 },
      ],
    });
  }

  archetypes.sort((a, b) => b.frequency - a.frequency);
  return archetypes;
}

function identifyGaps(
  citedPages: ExtractedPage[],
  domain: DomainAnalysis
): GapItem[] {
  const gaps: GapItem[] = [];
  const total = citedPages.length || 1;

  // Schema gap — always flag if user has no schema (AEO best practice)
  const pagesWithSchema = citedPages.filter((p) => p.schemaMarkup.length > 0).length;
  const schemaRate = pagesWithSchema / total;
  if (domain.existingSchemaTypes.length === 0) {
    gaps.push({
      name: "Missing JSON-LD Schema Markup",
      description: schemaRate > 0
        ? `${Math.round(schemaRate * 100)}% of top-cited pages have JSON-LD schema markup. Your page has none.`
        : "Your page has no JSON-LD schema markup. Adding structured data is one of the highest-impact AEO improvements.",
      impactScore: 0.4,
      difficulty: "easy",
      assetGenerated: true,
      category: "schema",
    });
  }

  // FAQ gap — always flag if user has no FAQ (AI engines strongly favor Q&A content)
  const pagesWithFaq = citedPages.filter((p) => p.faqSections.length >= 2).length;
  const faqRate = pagesWithFaq / total;
  if (!domain.hasFaq) {
    gaps.push({
      name: "Missing FAQ Section",
      description: faqRate > 0
        ? `${Math.round(faqRate * 100)}% of competitors have FAQ sections. AI engines strongly prefer pages with direct Q&A content.`
        : "Your page has no FAQ section. AI engines strongly favor pages with direct question-and-answer content for citations.",
      impactScore: 0.35,
      difficulty: "easy",
      assetGenerated: true,
      category: "faq",
    });
  }

  // Heading hierarchy gap
  const avgCitedHeadings = citedPages.reduce((s, p) => s + p.headings.length, 0) / total;
  const userHeadings = domain.page.headings.length;
  if (userHeadings < avgCitedHeadings * 0.5 || userHeadings < 5) {
    gaps.push({
      name: "Weak Heading Hierarchy",
      description: `Top-cited pages average ${Math.round(avgCitedHeadings)} headings. Your page has ${userHeadings}. AI engines use headings to understand content structure.`,
      impactScore: 0.28,
      difficulty: "medium",
      assetGenerated: true,
      category: "headings",
    });
  }

  // Content depth gap
  const avgCitedWords = citedPages.reduce((s, p) => s + p.wordCount, 0) / total;
  if (domain.page.wordCount < avgCitedWords * 0.5 || domain.contentDepth < 50) {
    gaps.push({
      name: "Insufficient Content Depth",
      description: avgCitedWords > 0
        ? `Top-cited pages average ${Math.round(avgCitedWords)} words. Your page has ${domain.page.wordCount}. Deeper content correlates with higher citation probability.`
        : `Your page has ${domain.page.wordCount} words. Richer, more comprehensive content correlates with higher AI citation probability.`,
      impactScore: 0.32,
      difficulty: "hard",
      assetGenerated: true,
      category: "content",
    });
  }

  // Specific schema types from cited pages
  const schemaTypeCounts: Record<string, number> = {};
  for (const page of citedPages) {
    for (const schema of page.schemaMarkup) {
      schemaTypeCounts[schema.type] = (schemaTypeCounts[schema.type] || 0) + 1;
    }
  }
  for (const [type, count] of Object.entries(schemaTypeCounts)) {
    const rate = count / total;
    if (rate > 0.3 && !domain.existingSchemaTypes.includes(type)) {
      gaps.push({
        name: `Missing ${type} Schema`,
        description: `${Math.round(rate * 100)}% of top-cited pages use ${type} schema. Adding this improves AI engine comprehension.`,
        impactScore: 0.2 + rate * 0.1,
        difficulty: "easy",
        assetGenerated: true,
        category: "schema",
      });
    }
  }

  // Internal linking gap
  const avgLinks = citedPages.reduce((s, p) => s + p.internalLinks.length, 0) / total;
  if (domain.page.internalLinks.length < avgLinks * 0.3) {
    gaps.push({
      name: "Weak Internal Link Structure",
      description: `Top-cited pages have an average of ${Math.round(avgLinks)} internal links. Your page has ${domain.page.internalLinks.length}.`,
      impactScore: 0.18,
      difficulty: "medium",
      assetGenerated: true,
      category: "structure",
    });
  }

  // Sort by impact
  gaps.sort((a, b) => b.impactScore - a.impactScore);
  return gaps;
}

function calculateCitationScore(domain: DomainAnalysis): number {
  let score = 10; // base

  if (domain.citationStatus === "cited") score += 30;
  if (domain.existingSchemaTypes.length > 0) score += 15;
  if (domain.hasFaq) score += 12;
  score += Math.min(domain.contentDepth * 0.2, 15);
  score += Math.min(domain.headingScore * 0.15, 12);
  if (domain.page.entityMentions.length > 5) score += 6;

  return Math.min(Math.round(score), 100);
}

function projectImprovedScore(currentScore: number, gaps: GapItem[]): number {
  let improvement = 0;
  for (const gap of gaps) {
    improvement += gap.impactScore * 40; // scale impact to score points
  }
  return Math.min(Math.round(currentScore + improvement), 95);
}

function scoreContentDepth(page: ExtractedPage): number {
  let score = 0;
  if (page.wordCount > 500) score += 20;
  if (page.wordCount > 1000) score += 20;
  if (page.wordCount > 2000) score += 15;
  if (page.faqSections.length > 0) score += 15;
  if (page.entityMentions.length > 5) score += 10;
  if (page.schemaMarkup.length > 0) score += 10;
  score += Math.min(page.headings.length * 2, 10);
  return Math.min(score, 100);
}

function scoreHeadings(page: ExtractedPage): number {
  let score = 0;
  const h1s = page.headings.filter((h) => h.level === 1).length;
  const h2s = page.headings.filter((h) => h.level === 2).length;
  const h3s = page.headings.filter((h) => h.level === 3).length;

  if (h1s === 1) score += 30; // exactly one H1 is ideal
  if (h1s > 1) score += 10;
  score += Math.min(h2s * 10, 40);
  score += Math.min(h3s * 5, 20);
  if (h2s > 0 && h3s > 0) score += 10; // multi-level hierarchy

  return Math.min(score, 100);
}

function calculateArchetypeMatch(
  domain: DomainAnalysis,
  archetype: CitationArchetype
): number {
  let matchCount = 0;

  for (const signal of archetype.signals) {
    if (checkSignalPresent(domain, signal)) matchCount++;
  }

  return Math.round((matchCount / (archetype.signals.length || 1)) * 100);
}

function checkSignalPresent(
  domain: DomainAnalysis,
  signal: StructuralSignal
): boolean {
  const name = signal.name.toLowerCase();
  if (name.includes("schema") || name.includes("json-ld"))
    return domain.existingSchemaTypes.length > 0;
  if (name.includes("faq")) return domain.hasFaq;
  if (name.includes("heading")) return domain.headingScore > 40;
  if (name.includes("word") || name.includes("content") || name.includes("deep"))
    return domain.contentDepth > 50;
  return false;
}
