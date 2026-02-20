"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Download,
  FileText,
  Loader2,
  AlertCircle,
  Check,
  Copy,
  FileJson,
  Eye,
  Lock,
} from "lucide-react";
import Link from "next/link";
import type { AnalysisStatusResponse } from "@/lib/types";

function estimatePageCount(data: AnalysisStatusResponse): number {
  let pages = 3; // cover + exec summary + gap report
  if (data.generatedAssets?.schemaMarkup) pages += 2;
  if (data.generatedAssets?.rewrittenCopy) pages += Math.ceil((data.generatedAssets.rewrittenCopy.wordCount || 500) / 350);
  if (data.generatedAssets?.contentSections) pages += data.generatedAssets.contentSections.length;
  if (data.generatedAssets?.internalLinks) pages += 1;
  if (data.discoveryResults?.citedUrls) pages += Math.ceil((data.discoveryResults.citedUrls.length || 0) / 5);
  pages += 1; // checklist
  return Math.max(pages, 6);
}

export default function BriefPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [data, setData] = useState<AnalysisStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/analyze/${jobId}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [jobId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/analyze/${jobId}/pdf/download`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const contentType = res.headers.get("content-type") || "";

      let ext = "html";
      if (contentType.includes("pdf")) ext = "pdf";
      else if (contentType.includes("wordprocessingml") || contentType.includes("docx")) ext = "docx";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scoutlytics-brief-${data?.domain || "report"}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const exportJson = () => {
    if (!data) return;
    const exportData = {
      domain: data.domain,
      topic: data.topic,
      citationScore: data.patternResults?.citationProbabilityScore,
      projectedScore: data.patternResults?.projectedScore,
      gaps: data.patternResults?.gaps,
      archetypes: data.patternResults?.archetypes,
      schemaMarkup: data.generatedAssets?.schemaMarkup?.jsonLd,
      citedUrls: data.discoveryResults?.citedUrls,
      domainAnalysis: data.domainAnalysis,
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#E74C3C] animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center text-white">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-serif mb-2">Brief Not Available</h2>
          <Link href="/analyze" className="text-[#E74C3C] hover:underline">
            Run a new analysis →
          </Link>
        </div>
      </div>
    );
  }

  const score = data.patternResults?.citationProbabilityScore ?? 0;
  const gaps = data.patternResults?.gaps ?? [];
  const assets = data.generatedAssets;

  const briefSections = [
    {
      title: "Executive Summary",
      description: "Citation score, key findings, and projected improvement",
      included: true,
    },
    {
      title: "Citation Analysis",
      description: `Top ${data.discoveryResults?.citedUrls?.length || 0} cited sources with frequencies`,
      included: !!data.discoveryResults,
    },
    {
      title: "Gap Report",
      description: `${gaps.length} gaps identified with impact scores and difficulty`,
      included: gaps.length > 0,
    },
    {
      title: "Schema Markup",
      description: "Ready-to-deploy JSON-LD structured data",
      included: !!assets?.schemaMarkup,
    },
    {
      title: "Rewritten Copy",
      description: "Optimized content for AI citation",
      included: !!assets?.rewrittenCopy,
    },
    {
      title: "Content Sections",
      description: "FAQ, comparison tables, and additional content blocks",
      included: !!assets?.contentSections && assets.contentSections.length > 0,
    },
    {
      title: "Implementation Checklist",
      description: "Step-by-step deployment guide",
      included: true,
    },
  ];

  return (
    <div className="relative min-h-screen text-white font-sans bg-bg-dark">
      <div className="fixed inset-0 bg-grid pointer-events-none z-0"></div>

      {/* Nav */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-full pl-6 pr-2 py-2 flex items-center gap-8 shadow-2xl shadow-black/50">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Scoutlytics" className="w-[70px] h-[70px] object-contain" />
            <span className="font-serif font-bold text-lg tracking-tight">Scoutlytics</span>
          </Link>
          <Link
            href={`/analyze/${jobId}/results`}
            className="text-xs text-gray-400 hover:text-white transition-colors hidden sm:block"
          >
            ← Back to Results
          </Link>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24 px-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full text-xs font-mono mb-4">
            <Check className="w-3 h-3" />
            Analysis Complete
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2">Implementation Brief</h1>
          <p className="text-gray-500 text-sm">
            {data.domain} — Score: {score}/100
          </p>
          <p className="text-gray-600 text-xs mt-2 font-mono">
            Your brief is approximately {estimatePageCount(data)} pages
          </p>
        </div>

        {/* PDF Preview with Blur */}
        <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden mb-8 relative">
          <div className="px-6 pt-5 pb-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#E74C3C]" />
              <span className="text-sm font-medium">Brief Preview</span>
            </div>
            <span className="text-[10px] text-gray-600 font-mono">
              {score}/100 → {data.patternResults?.projectedScore ?? 0}/100
            </span>
          </div>

          {/* Preview content — first section visible, rest blurred */}
          <div className="relative">
            <div className="p-6 space-y-4 text-sm text-gray-300 leading-relaxed max-h-[360px] overflow-hidden">
              <div className="text-xs text-gray-600 font-mono uppercase tracking-wider">Executive Summary</div>
              <p>
                This implementation brief provides deployment-ready assets to improve{" "}
                <span className="text-white font-medium">{data.domain}</span>&apos;s visibility in
                AI-generated answers for &ldquo;<span className="text-white font-medium">{data.topic}</span>&rdquo;.
              </p>
              <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div>
                  <div className="text-[10px] text-gray-600 uppercase">Current</div>
                  <div className={`text-3xl font-mono font-bold ${score < 40 ? "text-red-400" : score < 70 ? "text-yellow-400" : "text-green-400"}`}>{score}</div>
                </div>
                <div className="text-gray-600">→</div>
                <div>
                  <div className="text-[10px] text-gray-600 uppercase">Projected</div>
                  <div className="text-3xl font-mono font-bold text-green-400">{data.patternResults?.projectedScore ?? 0}</div>
                </div>
                <div className="flex-1 text-right">
                  <span className="text-green-400 text-sm font-mono">+{(data.patternResults?.projectedScore ?? 0) - score} pts</span>
                </div>
              </div>
              <div className="text-xs text-gray-600 font-mono uppercase tracking-wider pt-2">Gap Report — {gaps.length} gaps identified</div>
              <div className="space-y-2">
                {gaps.slice(0, 3).map((gap, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400">{gap.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${gap.impactScore > 0.3 ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      +{(gap.impactScore * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              {/* More content that will be blurred */}
              <div className="text-xs text-gray-600 font-mono uppercase tracking-wider pt-2">Schema Markup</div>
              <div className="bg-[#1a1a1a] rounded-lg p-3 font-mono text-xs text-green-300/60">
                {`{ "@context": "https://schema.org", "@type": "..." }`}
              </div>
              <div className="text-xs text-gray-600 font-mono uppercase tracking-wider pt-2">Rewritten Copy</div>
              <p className="text-gray-500 text-xs">Optimized content structured to match citation archetypes...</p>
            </div>

            {/* Blur overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/95 to-transparent flex flex-col items-center justify-end pb-6">
              <Lock className="w-5 h-5 text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 mb-3">Download to view the full brief</p>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-[#E74C3C] text-white px-6 py-2 rounded-lg text-xs font-semibold hover:bg-[#c0392b] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {downloading ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Preparing...</>
                ) : (
                  <><Download className="w-3 h-3" /> Download Full Brief</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Brief Contents Card */}
        <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden mb-8">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-[#E74C3C]" />
              <h2 className="text-sm font-medium">Brief Contents</h2>
            </div>
            <div className="space-y-3">
              {briefSections.map((section, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                      section.included
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-800 text-gray-600"
                    }`}
                  >
                    {section.included ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <span className="text-[10px]">—</span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-white">{section.title}</div>
                    <div className="text-xs text-gray-600">{section.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Download Actions */}
          <div className="p-6 space-y-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full bg-[#E74C3C] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#c0392b] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {downloading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Preparing download...</>
              ) : (
                <><Download className="w-4 h-4" /> Download PDF Brief</>
              )}
            </button>

            <button
              onClick={exportJson}
              className="w-full border border-white/10 text-gray-400 py-3 rounded-lg text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              {copiedJson ? (
                <><Check className="w-4 h-4 text-green-400" /> JSON Copied to Clipboard</>
              ) : (
                <><Copy className="w-4 h-4" /> Copy JSON to Clipboard</>
              )}
            </button>

            <a
              href={`/api/analyze/${jobId}/export`}
              download
              className="w-full border border-white/10 text-gray-400 py-3 rounded-lg text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <FileJson className="w-4 h-4" />
              Download Full JSON Export
            </a>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-mono font-bold text-[#E74C3C]">{score}</div>
            <div className="text-xs text-gray-600 mt-1">Current Score</div>
          </div>
          <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-mono font-bold text-green-400">
              {data.patternResults?.projectedScore ?? 0}
            </div>
            <div className="text-xs text-gray-600 mt-1">Projected</div>
          </div>
          <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-mono font-bold text-yellow-400">{gaps.length}</div>
            <div className="text-xs text-gray-600 mt-1">Gaps Found</div>
          </div>
        </div>
      </main>
    </div>
  );
}
