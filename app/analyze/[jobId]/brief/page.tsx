"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  Download,
  FileText,
  Loader2,
  AlertCircle,
  Check,
  Copy,
  FileJson,
} from "lucide-react";
import Link from "next/link";
import type { AnalysisStatusResponse } from "@/lib/types";

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
      const ext = contentType.includes("pdf") ? "pdf" : "html";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `citefix-brief-${data?.domain || "report"}.${ext}`;
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
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#E74C3C] rotate-45 rounded-sm"></div>
              <Sparkles className="relative text-white w-3 h-3" />
            </div>
            <span className="font-serif font-bold text-lg tracking-tight">CiteFix</span>
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
        </div>

        {/* Brief Preview Card */}
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
                <><FileJson className="w-4 h-4" /> Export as JSON (copy to clipboard)</>
              )}
            </button>
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
