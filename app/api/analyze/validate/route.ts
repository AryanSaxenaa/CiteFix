import { NextRequest, NextResponse } from "next/server";

interface ValidationResult {
  valid: boolean;
  reachable: boolean;
  hostname: string;
  sitemapFound: boolean;
  sitemapUrl?: string;
  robotsTxtFound: boolean;
  robotsTxtContent?: string;
  pageCount?: number;
  error?: string;
  dnsResolveMs?: number;
}

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();
    if (!domain || typeof domain !== "string" || domain.trim().length < 3) {
      return NextResponse.json(
        { valid: false, error: "Domain required" },
        { status: 400 }
      );
    }

    let url: URL;
    try {
      const normalized = domain.startsWith("http") ? domain : `https://${domain}`;
      url = new URL(normalized);
    } catch {
      return NextResponse.json({
        valid: false,
        reachable: false,
        hostname: domain,
        sitemapFound: false,
        robotsTxtFound: false,
        error: "Invalid URL format",
      } satisfies ValidationResult);
    }

    const result: ValidationResult = {
      valid: true,
      reachable: false,
      hostname: url.hostname,
      sitemapFound: false,
      robotsTxtFound: false,
    };

    // DNS / reachability check
    const dnsStart = Date.now();
    try {
      const res = await fetch(url.origin, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
        redirect: "follow",
      });
      result.reachable = res.ok || res.status < 500;
      result.dnsResolveMs = Date.now() - dnsStart;
    } catch {
      // Try GET as HEAD fallback (some servers reject HEAD)
      try {
        const res = await fetch(url.origin, {
          signal: AbortSignal.timeout(5000),
          redirect: "follow",
        });
        result.reachable = res.ok || res.status < 500;
        result.dnsResolveMs = Date.now() - dnsStart;
      } catch {
        result.reachable = false;
        result.dnsResolveMs = Date.now() - dnsStart;
        result.error = "Domain unreachable";
      }
    }

    // robots.txt check
    try {
      const robotsRes = await fetch(`${url.origin}/robots.txt`, {
        signal: AbortSignal.timeout(3000),
      });
      if (robotsRes.ok) {
        const text = await robotsRes.text();
        if (text.length > 10 && text.toLowerCase().includes("user-agent")) {
          result.robotsTxtFound = true;
          result.robotsTxtContent = text.slice(0, 500);

          // Extract sitemap URL from robots.txt
          const sitemapMatch = text.match(/sitemap:\s*(https?:\/\/\S+)/i);
          if (sitemapMatch) {
            result.sitemapUrl = sitemapMatch[1];
            result.sitemapFound = true;
          }
        }
      }
    } catch {
      // Non-critical
    }

    // Fallback: try common sitemap URLs
    if (!result.sitemapFound) {
      for (const sitemapPath of ["/sitemap.xml", "/sitemap_index.xml"]) {
        try {
          const sitemapRes = await fetch(`${url.origin}${sitemapPath}`, {
            method: "HEAD",
            signal: AbortSignal.timeout(3000),
          });
          if (sitemapRes.ok) {
            result.sitemapFound = true;
            result.sitemapUrl = `${url.origin}${sitemapPath}`;
            break;
          }
        } catch {
          // Continue to next path
        }
      }
    }

    // Try to estimate page count from sitemap
    if (result.sitemapFound && result.sitemapUrl) {
      try {
        const sitemapRes = await fetch(result.sitemapUrl, {
          signal: AbortSignal.timeout(3000),
        });
        if (sitemapRes.ok) {
          const xml = await sitemapRes.text();
          const urlCount = (xml.match(/<loc>/gi) || []).length;
          if (urlCount > 0) result.pageCount = urlCount;
        }
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { valid: false, error: err instanceof Error ? err.message : "Validation failed" },
      { status: 500 }
    );
  }
}
