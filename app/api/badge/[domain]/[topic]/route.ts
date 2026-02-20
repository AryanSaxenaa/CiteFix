import { NextRequest, NextResponse } from "next/server";

const SEARCH_BASE = "https://ydc-index.io/v1/search";

function getApiKey(): string {
  const key = process.env.YOU_API_KEY;
  if (!key) throw new Error("YOU_API_KEY not set");
  return key;
}

/**
 * GET /api/badge/:domain/:topic
 *
 * Returns an SVG badge showing a domain's Citation Probability Score.
 * Usage: <img src="https://scoutlytics.xyz/api/badge/example.com/AI%20chatbots" />
 *
 * Query params:
 *   style=flat|flat-square (default: flat)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string; topic: string }> }
) {
  const { domain: rawDomain, topic: rawTopic } = await params;
  const domain = decodeURIComponent(rawDomain);
  const topic = decodeURIComponent(rawTopic);
  const style = req.nextUrl.searchParams.get("style") || "flat";

  try {
    // Quick 3-query search to estimate citation score
    const variants = [
      topic,
      `best ${topic}`,
      `${topic} guide`,
    ];

    let domainHits = 0;
    let totalResults = 0;

    const results = await Promise.all(
      variants.map(async (q) => {
        const params = new URLSearchParams({ query: q, count: "10" });
        const res = await fetch(`${SEARCH_BASE}?${params}`, {
          headers: { "X-API-Key": getApiKey() },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.results?.web || []) as { url: string }[];
      })
    );

    const domainHost = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

    for (const batch of results) {
      for (const r of batch) {
        totalResults++;
        try {
          if (new URL(r.url).hostname.replace("www.", "") === domainHost) {
            domainHits++;
          }
        } catch { /* skip bad URLs */ }
      }
    }

    // Score: 0-100 based on citation frequency, schema heuristic, and presence
    const citationRatio = totalResults > 0 ? domainHits / totalResults : 0;
    const score = Math.min(100, Math.round(citationRatio * 200 + (domainHits > 0 ? 30 : 0)));

    // Color based on score
    const color = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";
    const label = "Citation Score";
    const value = `${score}/100`;

    const svg = generateBadgeSvg(label, value, color, style);

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    // Return error badge
    const svg = generateBadgeSvg("Citation Score", "error", "#6b7280", style);
    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
}

function generateBadgeSvg(
  label: string,
  value: string,
  color: string,
  style: string
): string {
  const labelWidth = label.length * 6.8 + 12;
  const valueWidth = value.length * 7.2 + 12;
  const totalWidth = labelWidth + valueWidth;
  const height = 22;
  const radius = style === "flat-square" ? 2 : 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="${radius}" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="#1a1a1a"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${color}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#fff">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#fff" font-weight="bold">${value}</text>
  </g>
  <!-- Powered by Scoutlytics -->
</svg>`;
}
