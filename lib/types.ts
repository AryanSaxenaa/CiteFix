export interface AnalysisJob {
  jobId: string;
  domain: string;
  topic: string;
  intentVariants: string[];
  config: AnalysisConfig;
  status: "pending" | "running" | "complete" | "failed";
  stage: number; // 0-5
  stageLabel: string;
  createdAt: number;
  completedAt?: number;
  userEmail?: string;
  error?: string;

  // Stage results (populated as pipeline progresses)
  discoveryResults?: DiscoveryResults;
  extractionResults?: ExtractionResults;
  domainAnalysis?: DomainAnalysis;
  patternResults?: PatternResults;
  generatedAssets?: GeneratedAssets;
  advancedResearch?: AdvancedResearchResults;
  apiTracking?: ApiCallTracking;
  pdfUrl?: string;
}

// Advanced Agent research results
export interface AdvancedResearchResults {
  insights: string;
  contradictions: string[];
  knowledgeGaps: string[];
  contentOpportunities: string[];
  timestamp: number;
}

// API call tracking for transparency
export interface ApiCallTracking {
  calls: ApiCallRecord[];
  totalCalls: number;
  totalDurationMs: number;
}

export interface ApiCallRecord {
  api: "search" | "contents" | "express-agent" | "advanced-agent" | "foxit-pdf" | "foxit-docgen";
  endpoint: string;
  timestamp: number;
  durationMs: number;
  status: "success" | "error";
  details?: string;
}

export interface AnalysisConfig {
  depth: "quick" | "standard" | "deep";
  sourceTypes: ("web" | "news")[];
  outputFormat: "pdf" | "json" | "both";
  competitors: string[];
  country: string;
  brandVoiceSamples?: string[];
}

// Stage 1: Citation Discovery
export interface CitedUrl {
  url: string;
  title: string;
  description: string;
  snippets: string[];
  faviconUrl?: string;
  citationCount: number;
  queryVariant: string;
  publishedDate?: string; // ISO date-time from You.com page_age
}

export interface DiscoveryResults {
  citedUrls: CitedUrl[];
  queryVariants: string[];
  totalResults: number;
  userDomainFound: boolean;
  userDomainPosition?: number;
}

// Stage 2: Content Extraction
export interface ExtractedPage {
  url: string;
  title: string;
  content: string; // markdown or plain text
  headings: HeadingNode[];
  schemaMarkup: SchemaMarkupInfo[];
  faqSections: FaqItem[];
  wordCount: number;
  internalLinks: string[];
  entityMentions: string[];
}

export interface HeadingNode {
  level: number; // 1-6
  text: string;
}

export interface SchemaMarkupInfo {
  type: string; // Article, Product, FAQPage, etc.
  properties: Record<string, unknown>;
  isValid: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ExtractionResults {
  pages: ExtractedPage[];
  extractedCount: number;
}

// Stage 2b: Domain Analysis
export interface DomainAnalysis {
  page: ExtractedPage;
  existingSchemaTypes: string[];
  hasFaq: boolean;
  contentDepth: number; // 0-100
  headingScore: number; // 0-100
  citationStatus: "cited" | "not_cited";
}

// Stage 3: Pattern Analysis
export interface CitationArchetype {
  name: string;
  description: string;
  frequency: number; // percentage of top pages matching
  signals: StructuralSignal[];
}

export interface StructuralSignal {
  name: string;
  present: boolean;
  score: number;
}

export interface GapItem {
  name: string;
  description: string;
  impactScore: number; // 0 to 1
  difficulty: "easy" | "medium" | "hard";
  assetGenerated: boolean;
  category: "schema" | "content" | "structure" | "faq" | "headings";
  scoreImpact?: number; // projected score increase if this gap is fixed
  beforeState?: string; // current state description
  afterState?: string; // proposed state after fix
}

export interface PatternResults {
  archetypes: CitationArchetype[];
  gaps: GapItem[];
  citationProbabilityScore: number; // 0-100
  projectedScore: number; // 0-100
  userArchetypeMatch: number; // percentage
}

// Stage 4: Asset Generation
export interface GeneratedAssets {
  rewrittenCopy?: {
    markdown: string;
    plainText: string;
    wordCount: number;
  };
  schemaMarkup?: {
    jsonLd: string; // stringified JSON-LD
    types: string[];
    isValid: boolean;
  };
  contentSections?: ContentSection[];
  internalLinks?: {
    recommendations: LinkRecommendation[];
  };
}

export interface ContentSection {
  title: string;
  type: "faq" | "comparison" | "howto" | "expert";
  html: string;
  markdown: string;
}

export interface LinkRecommendation {
  fromPage: string;
  toPage: string;
  anchorText: string;
  reason: string;
}

// API request/response types
export interface CreateAnalysisRequest {
  domain: string;
  topic: string;
  config?: Partial<AnalysisConfig>;
}

export interface CreateAnalysisResponse {
  jobId: string;
  status: string;
}

export interface AnalysisStatusResponse {
  jobId: string;
  domain: string;
  topic: string;
  status: AnalysisJob["status"];
  stage: number;
  stageLabel: string;
  discoveryResults?: DiscoveryResults;
  extractionResults?: ExtractionResults;
  domainAnalysis?: DomainAnalysis;
  patternResults?: PatternResults;
  generatedAssets?: GeneratedAssets;
  advancedResearch?: AdvancedResearchResults;
  apiTracking?: ApiCallTracking;
  pdfUrl?: string;
  error?: string;
}
