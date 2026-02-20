import { CitedUrl, ExtractedPage, HeadingNode, SchemaMarkupInfo, FaqItem, ApiCallRecord } from "./types";

const SEARCH_BASE = "https://ydc-index.io/v1/search";
const AGENT_BASE = "https://api.you.com/v1/agents/runs";

// Global API call tracker
const apiCallLog: ApiCallRecord[] = [];

export function getApiCallLog(): ApiCallRecord[] {
  return [...apiCallLog];
}

export function clearApiCallLog(): void {
  apiCallLog.length = 0;
}

function trackApiCall(
  api: ApiCallRecord["api"],
  endpoint: string,
  startTime: number,
  status: "success" | "error",
  details?: string
): void {
  apiCallLog.push({
    api,
    endpoint,
    timestamp: startTime,
    durationMs: Date.now() - startTime,
    status,
    details,
  });
}

function getApiKey(): string {
  const key = process.env.YOU_API_KEY;
  if (!key) throw new Error("YOU_API_KEY environment variable is not set");
  return key;
}

// Citation Discovery — runs search for multiple query variants
export async function searchCitations(
  topic: string,
  count: number = 10,
  country?: string
): Promise<{ results: CitedUrl[]; queryVariants: string[] }> {
  const variants = generateQueryVariants(topic);
  const allResults: CitedUrl[] = [];

  const searchPromises = variants.map((variant) =>
    searchSingle(variant, count, country)
  );
  const searchResults = await Promise.all(searchPromises);

  for (let i = 0; i < searchResults.length; i++) {
    const results = searchResults[i];
    const variant = variants[i];
    for (const r of results) {
      const existing = allResults.find((e) => e.url === r.url);
      if (existing) {
        existing.citationCount++;
      } else {
        allResults.push({
          url: r.url,
          title: r.title,
          description: r.description,
          snippets: r.snippets,
          faviconUrl: r.faviconUrl,
          citationCount: 1,
          queryVariant: variant,
          publishedDate: r.publishedDate,
        });
      }
    }
  }

  // Sort by citation frequency (appears across more query variants = stronger)
  allResults.sort((a, b) => b.citationCount - a.citationCount);

  return { results: allResults.slice(0, count), queryVariants: variants };
}

async function searchSingle(
  query: string,
  count: number,
  country?: string
): Promise<
  {
    url: string;
    title: string;
    description: string;
    snippets: string[];
    faviconUrl?: string;
    publishedDate?: string;
  }[]
> {
  const startTime = Date.now();
  const params = new URLSearchParams({
    query,
    count: String(count),
  });
  if (country) params.set("country", country);

  try {
    const res = await fetch(`${SEARCH_BASE}?${params.toString()}`, {
      headers: { "X-API-Key": getApiKey() },
    });

    if (!res.ok) {
      const text = await res.text();
      trackApiCall("search", `Search: "${query}"`, startTime, "error", `${res.status}: ${text}`);
      throw new Error(`You.com Search API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const webResults = data.results?.web || [];

    trackApiCall("search", `Search: "${query}"`, startTime, "success", `${webResults.length} results`);

    return webResults.map(
      (r: {
        url: string;
        title: string;
        description: string;
        snippets?: string[];
        favicon_url?: string;
        page_age?: string;
      }) => ({
        url: r.url,
        title: r.title || "",
        description: r.description || "",
        snippets: r.snippets || [],
        faviconUrl: r.favicon_url,
        publishedDate: r.page_age || undefined,
      })
    );
  } catch (err) {
    if (!apiCallLog.find(c => c.timestamp === startTime)) {
      trackApiCall("search", `Search: "${query}"`, startTime, "error", String(err));
    }
    throw err;
  }
}

// Content Extraction — uses Search API with livecrawl to get full page content
export async function extractPageContent(url: string): Promise<ExtractedPage> {
  const startTime = Date.now();
  const params = new URLSearchParams({
    query: `site:${new URL(url).hostname}`,
    count: "1",
    livecrawl: "web",
    livecrawl_formats: "markdown",
  });

  try {
    const res = await fetch(`${SEARCH_BASE}?${params.toString()}`, {
      headers: { "X-API-Key": getApiKey() },
    });

    if (!res.ok) {
      trackApiCall("contents", `Livecrawl: ${new URL(url).hostname}`, startTime, "error", `${res.status}`);
      throw new Error(`You.com Contents extraction failed for ${url}: ${res.status}`);
    }

    const data = await res.json();
    const webResults = data.results?.web || [];

    // Find the matching result or use first
    const match =
      webResults.find(
        (r: { url: string }) =>
          r.url === url || r.url.includes(new URL(url).hostname)
      ) || webResults[0];

    if (!match) {
      trackApiCall("contents", `Livecrawl: ${new URL(url).hostname}`, startTime, "success", "No content found");
      return createEmptyPage(url);
    }

    const content = match.contents?.markdown || match.contents?.html || match.description || "";
    trackApiCall("contents", `Livecrawl: ${new URL(url).hostname}`, startTime, "success", `${content.length} chars extracted`);

    return parsePage(url, match.title || "", content);
  } catch (err) {
    if (!apiCallLog.find(c => c.timestamp === startTime)) {
      trackApiCall("contents", `Livecrawl: ${new URL(url).hostname}`, startTime, "error", String(err));
    }
    throw err;
  }
}

// Batch extraction for multiple URLs
export async function extractMultiplePages(
  urls: string[]
): Promise<ExtractedPage[]> {
  const promises = urls.map((url) =>
    extractPageContent(url).catch(() => createEmptyPage(url))
  );
  return Promise.all(promises);
}

// Agent API — for complex research and content generation
export async function runExpressAgent(input: string): Promise<string> {
  const startTime = Date.now();

  try {
    const res = await fetch(AGENT_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent: "express",
        input,
        stream: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      trackApiCall("express-agent", `Express Agent: ${input.slice(0, 60)}...`, startTime, "error", `${res.status}: ${text}`);
      throw new Error(`You.com Agent API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    let result = "";
    // Extract the text response from the agent
    if (data.output) {
      if (typeof data.output === "string") result = data.output;
      else if (Array.isArray(data.output)) {
        result = data.output
          .filter((item: { type: string }) => item.type === "text")
          .map((item: { text: string }) => item.text)
          .join("\n");
      }
    }
    if (!result) result = JSON.stringify(data);

    trackApiCall("express-agent", `Express Agent: ${input.slice(0, 60)}...`, startTime, "success", `${result.length} chars`);
    return result;
  } catch (err) {
    if (!apiCallLog.find(c => c.timestamp === startTime)) {
      trackApiCall("express-agent", `Express Agent: ${input.slice(0, 60)}...`, startTime, "error", String(err));
    }
    throw err;
  }
}

// Advanced Agent for deep multi-step research 
export async function runAdvancedAgent(input: string): Promise<string> {
  const startTime = Date.now();

  try {
    const res = await fetch(AGENT_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent: "advanced",
        input,
        stream: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      trackApiCall("advanced-agent", `Advanced Agent: ${input.slice(0, 60)}...`, startTime, "error", `${res.status}: ${text}`);
      throw new Error(`You.com Advanced Agent error: ${res.status}: ${text}`);
    }

    const data = await res.json();
    let result = "";
    if (data.output) {
      if (typeof data.output === "string") result = data.output;
      else if (Array.isArray(data.output)) {
        result = data.output
          .filter((item: { type: string }) => item.type === "text")
          .map((item: { text: string }) => item.text)
          .join("\n");
      }
    }
    if (!result) result = JSON.stringify(data);

    trackApiCall("advanced-agent", `Advanced Agent: ${input.slice(0, 60)}...`, startTime, "success", `${result.length} chars`);
    return result;
  } catch (err) {
    if (!apiCallLog.find(c => c.timestamp === startTime)) {
      trackApiCall("advanced-agent", `Advanced Agent: ${input.slice(0, 60)}...`, startTime, "error", String(err));
    }
    throw err;
  }
}

// Streaming agent for advanced research (kept for potential future use)
export async function runAdvancedAgentStream(
  input: string,
  onChunk: (text: string) => void
): Promise<string> {
  const res = await fetch(AGENT_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent: "advanced",
      input,
      stream: true,
      tools: [
        {
          type: "research",
          search_effort: "high",
          report_verbosity: "high",
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`You.com Advanced Agent error: ${res.status}`);
  }

  let fullText = "";
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "response.output_text.delta") {
            const delta = event.response?.delta || "";
            fullText += delta;
            onChunk(delta);
          }
        } catch {
          // skip unparseable lines
        }
      }
    }
  }

  return fullText;
}

function generateQueryVariants(topic: string): string[] {
  const base = topic.toLowerCase().trim();
  return [
    topic,
    `what is the best ${base}`,
    `${base} comparison review`,
    `how to choose ${base}`,
    `${base} vs alternatives`,
  ];
}

// Generate AI-powered topic intent suggestions using Express Agent
export async function generateTopicSuggestions(topic: string): Promise<string[]> {
  try {
    const prompt = `Given the topic "${topic}", generate exactly 5 related search intent variants that a user might search in AI engines like ChatGPT, Perplexity, or Google AI Overviews. 
Return ONLY the 5 queries, one per line, with no numbering, no bullets, no extra text. Each should be a natural search query.
Focus on different intent types: informational, comparison, buying, how-to, and expert opinion.`;

    const response = await runExpressAgent(prompt);
    const suggestions = response
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 5 && s.length < 100 && !s.startsWith("-") && !s.match(/^\d+\./))
      .slice(0, 5);

    return suggestions.length > 0 ? suggestions : getDefaultSuggestions(topic);
  } catch {
    return getDefaultSuggestions(topic);
  }
}

function getDefaultSuggestions(topic: string): string[] {
  const base = topic.toLowerCase().trim();
  return [
    `best ${base} 2025`,
    `${base} vs competitors`,
    `how to choose ${base}`,
    `${base} reviews and ratings`,
    `is ${base} worth it`,
  ];
}

function parsePage(url: string, title: string, content: string): ExtractedPage {
  const headings = extractHeadings(content);
  const schemaMarkup = extractSchemaMarkup(content);
  const faqSections = extractFaqs(content);
  const internalLinks = extractInternalLinks(content, url);
  const entityMentions = extractEntities(content);

  return {
    url,
    title,
    content,
    headings,
    schemaMarkup,
    faqSections,
    wordCount: content.split(/\s+/).length,
    internalLinks,
    entityMentions,
  };
}

function extractHeadings(content: string): HeadingNode[] {
  const headings: HeadingNode[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      headings.push({ level: match[1].length, text: match[2].trim() });
    }
  }
  return headings;
}

function extractSchemaMarkup(content: string): SchemaMarkupInfo[] {
  const schemas: SchemaMarkupInfo[] = [];
  const jsonLdPattern = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdPattern.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      schemas.push({
        type: parsed["@type"] || "Unknown",
        properties: parsed,
        isValid: true,
      });
    } catch {
      schemas.push({ type: "Invalid", properties: {}, isValid: false });
    }
  }
  return schemas;
}

function extractFaqs(content: string): FaqItem[] {
  const faqs: FaqItem[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.endsWith("?") && (line.startsWith("#") || line.startsWith("**") || line.startsWith("Q:"))) {
      const question = line.replace(/^[#*Q:\s]+/, "").trim();
      const answerLines: string[] = [];
      for (let j = i + 1; j < lines.length && j < i + 5; j++) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.endsWith("?") && !nextLine.startsWith("#")) {
          answerLines.push(nextLine);
        } else break;
      }
      if (answerLines.length > 0) {
        faqs.push({ question, answer: answerLines.join(" ") });
      }
    }
  }
  return faqs;
}

function extractInternalLinks(content: string, baseUrl: string): string[] {
  const links: string[] = [];
  try {
    const hostname = new URL(baseUrl).hostname;
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      const href = match[2];
      if (href.includes(hostname) || href.startsWith("/")) {
        links.push(href);
      }
    }
  } catch {
    // ignore URL parse errors
  }
  return [...new Set(links)];
}

function extractEntities(content: string): string[] {
  // Extract capitalized multi-word phrases as potential entities
  const entityPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  const entities = new Set<string>();
  let match;
  while ((match = entityPattern.exec(content)) !== null) {
    entities.add(match[1]);
  }
  return Array.from(entities).slice(0, 30);
}

function createEmptyPage(url: string): ExtractedPage {
  return {
    url,
    title: "",
    content: "",
    headings: [],
    schemaMarkup: [],
    faqSections: [],
    wordCount: 0,
    internalLinks: [],
    entityMentions: [],
  };
}
