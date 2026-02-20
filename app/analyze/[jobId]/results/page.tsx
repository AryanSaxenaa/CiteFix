"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Globe,
  TrendingUp,
  FileJson,
  Check,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  ExternalLink,
  BarChart3,
  Brain,
  Zap,
  Clock,
  Activity,
} from "lucide-react";
import Link from "next/link";
import type { AnalysisStatusResponse } from "@/lib/types";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [data, setData] = useState<AnalysisStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"schema" | "copy" | "sections" | "links">("schema");
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [expandedCitation, setExpandedCitation] = useState<number | null>(null);
  const [showApiDetails, setShowApiDetails] = useState(false);
  const [schemaValidation, setSchemaValidation] = useState<{
    isValid: boolean;
    errors: { path: string; message: string; severity: string }[];
    warnings: { property: string; message: string; suggestion: string }[];
    score: number;
    types: string[];
    recommendations: string[];
  } | null>(null);
  const [validatingSchema, setValidatingSchema] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/analyze/${jobId}`);
        if (!res.ok) throw new Error("Failed to load results");
        const result = await res.json();
        setData(result);
      } catch {
        // Retry once after a short delay
        setTimeout(async () => {
          try {
            const res = await fetch(`/api/analyze/${jobId}`);
            const result = await res.json();
            setData(result);
          } catch {
            setData(null);
          }
        }, 2000);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [jobId]);

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
          <h2 className="text-xl font-serif mb-2">Results Not Found</h2>
          <p className="text-gray-500 mb-4">This analysis may have expired or not completed.</p>
          <Link href="/analyze" className="text-[#E74C3C] hover:underline">
            Run a new analysis →
          </Link>
        </div>
      </div>
    );
  }

  const score = data.patternResults?.citationProbabilityScore ?? 0;
  const projected = data.patternResults?.projectedScore ?? 0;
  const gaps = data.patternResults?.gaps ?? [];
  const archetypes = data.patternResults?.archetypes ?? [];
  const citedUrls = data.discoveryResults?.citedUrls ?? [];
  const assets = data.generatedAssets;

  const scoreColor = score < 40 ? "text-red-400" : score < 70 ? "text-yellow-400" : "text-green-400";
  const scoreBg = score < 40 ? "bg-red-500/10" : score < 70 ? "bg-yellow-500/10" : "bg-green-500/10";

  const copySchema = () => {
    if (assets?.schemaMarkup?.jsonLd) {
      navigator.clipboard.writeText(
        `<script type="application/ld+json">\n${assets.schemaMarkup.jsonLd}\n</script>`
      );
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    }
  };

  const runSchemaValidation = async () => {
    setValidatingSchema(true);
    try {
      const res = await fetch(`/api/analyze/${jobId}/validate-schema`, {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        setSchemaValidation(result.validation);
      }
    } catch { /* ignore */ }
    setValidatingSchema(false);
  };

  // Freshness helper: returns { label, color } for a given date
  const getFreshness = (dateStr?: string): { label: string; color: string; bgColor: string } => {
    if (!dateStr) return { label: "Unknown", color: "text-gray-600", bgColor: "bg-gray-500/10" };
    try {
      const date = new Date(dateStr);
      const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (days < 7) return { label: `${days}d ago`, color: "text-green-400", bgColor: "bg-green-500/10" };
      if (days < 30) return { label: `${Math.floor(days / 7)}w ago`, color: "text-green-400", bgColor: "bg-green-500/10" };
      if (days < 90) return { label: `${Math.floor(days / 30)}mo ago`, color: "text-yellow-400", bgColor: "bg-yellow-500/10" };
      if (days < 365) return { label: `${Math.floor(days / 30)}mo ago`, color: "text-orange-400", bgColor: "bg-orange-500/10" };
      return { label: `${Math.floor(days / 365)}y ago`, color: "text-red-400", bgColor: "bg-red-500/10" };
    } catch {
      return { label: "Unknown", color: "text-gray-600", bgColor: "bg-gray-500/10" };
    }
  };

  return (
    <div className="relative min-h-screen text-white font-sans bg-bg-dark">
      <div className="fixed inset-0 bg-grid pointer-events-none z-0"></div>

      {/* Nav */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-full pl-6 pr-2 py-2 flex items-center gap-8 shadow-2xl shadow-black/50">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Scoutlytics" className="w-7 h-7 object-contain" />
            <span className="font-serif font-bold text-lg tracking-tight">Scoutlytics</span>
          </Link>
          <Link href="/analyze" className="text-xs text-gray-400 hover:text-white transition-colors hidden sm:block">
            New Analysis
          </Link>
        </div>
      </nav>

      {/* Sticky Download Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F0F0F]/95 backdrop-blur-xl border-t border-white/10 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`text-2xl font-mono font-bold ${scoreColor}`}>{score}</div>
            <div className="text-sm text-gray-500">
              → <span className="text-green-400 font-medium">{projected}</span> projected
            </div>
          </div>
          <button
            onClick={() => router.push(`/analyze/${jobId}/brief`)}
            className="bg-[#E74C3C] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#c0392b] transition-all flex items-center gap-2 shadow-lg shadow-red-900/20"
          >
            <Download className="w-4 h-4" />
            Download Implementation Brief
          </button>
        </div>
      </div>

      <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">
        {/* Score Header */}
        <section className="mb-12">
          <div className={`${scoreBg} border border-white/10 rounded-2xl p-8`}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="text-center md:text-left">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-mono">
                  Citation Probability Score
                </div>
                <div className={`text-7xl font-mono font-bold ${scoreColor}`}>{score}</div>
                <div className="text-sm text-gray-500 mt-1">out of 100</div>
              </div>

              <div className="flex items-center gap-4">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <div>
                  <div className="text-sm text-gray-400">Projected after fixes</div>
                  <div className="text-3xl font-mono font-bold text-green-400">{projected}</div>
                </div>
              </div>

              <div className="flex-1 text-right hidden md:block">
                <div className="text-sm text-gray-500">Improvement</div>
                <div className="text-2xl font-mono text-green-400 font-bold">
                  +{projected - score} pts
                </div>
                <div className="text-xs text-gray-600">{gaps.length} gaps identified</div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Citation Map */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#E74C3C]" />
              Citation Map
            </h2>
            <div className="bg-[#0F0F0F] border border-white/10 rounded-xl overflow-hidden">
              {citedUrls.slice(0, 10).map((url, i) => {
                let hostname = "";
                try { hostname = new URL(url.url).hostname; } catch { hostname = "unknown"; }
                return (
                <div key={i}>
                  <button
                    onClick={() => setExpandedCitation(expandedCitation === i ? null : i)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                      alt=""
                      width={20}
                      height={20}
                      className="rounded shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-300 truncate">
                        {url.title || hostname}
                      </div>
                      <div className="text-xs text-gray-600 truncate">{hostname}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="text-xs text-[#E74C3C] font-mono">
                        {url.citationCount}×
                      </div>
                      <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#E74C3C] rounded-full"
                          style={{ width: `${Math.min(100, (url.citationCount / Math.max(...citedUrls.map(u => u.citationCount))) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </button>
                  {expandedCitation === i && (
                    <div className="px-4 pb-3 text-xs space-y-1 border-b border-white/5">
                      <div className="text-gray-500">{url.description}</div>
                      {/* Freshness Indicator */}
                      {(() => {
                        const fresh = getFreshness(url.publishedDate);
                        return (
                          <div className={`inline-flex items-center gap-1 ${fresh.bgColor} ${fresh.color} px-2 py-0.5 rounded-full text-[10px] font-mono`}>
                            <Clock className="w-2.5 h-2.5" />
                            {fresh.label}
                          </div>
                        );
                      })()}
                      <div className="text-gray-600 font-mono truncate">{url.url}</div>
                      <a
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1"
                      >
                        View page <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
                );
              })}

              {/* User domain status */}
              <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      data.discoveryResults?.userDomainFound ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-xs text-gray-400">
                    {data.discoveryResults?.userDomainFound
                      ? `Your domain: position #${data.discoveryResults.userDomainPosition}`
                      : "Your domain: not currently cited"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column: Gap Analysis */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-medium mb-4">Gap Analysis</h2>
            <div className="space-y-3">
              {gaps.map((gap, i) => (
                <div
                  key={i}
                  className="bg-[#0F0F0F] border border-white/10 rounded-xl p-4 hover:border-[#E74C3C]/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-medium text-white">{gap.name}</h3>
                    {gap.assetGenerated && (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full shrink-0">
                        ✓ Generated
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{gap.description}</p>

                  {/* Per-gap score projection */}
                  {gap.scoreImpact && (
                    <div className="flex items-center gap-2 mb-3 bg-green-500/5 border border-green-500/10 rounded-lg px-3 py-1.5">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400 font-mono">
                        +{gap.scoreImpact} pts
                      </span>
                      <span className="text-xs text-gray-600">if fixed</span>
                    </div>
                  )}

                  {/* Before / After comparison */}
                  {gap.beforeState && gap.afterState && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2">
                        <div className="text-[10px] text-red-400 font-mono mb-1">BEFORE</div>
                        <div className="text-[11px] text-gray-400 leading-snug">{gap.beforeState}</div>
                      </div>
                      <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-2">
                        <div className="text-[10px] text-green-400 font-mono mb-1">AFTER</div>
                        <div className="text-[11px] text-gray-400 leading-snug">{gap.afterState}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        gap.impactScore > 0.3
                          ? "bg-red-500/20 text-red-400"
                          : gap.impactScore > 0.2
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      +{(gap.impactScore * 100).toFixed(0)}% impact
                    </span>
                    <span
                      className={`${
                        gap.difficulty === "easy"
                          ? "text-green-400"
                          : gap.difficulty === "medium"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {gap.difficulty}
                    </span>
                  </div>
                </div>
              ))}

              {gaps.length === 0 && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 text-center">
                  <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-green-400">No major gaps detected!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Generated Assets */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-medium mb-4">Generated Assets</h2>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-[#0F0F0F] p-1 rounded-lg border border-white/5">
              {[
                { id: "schema" as const, label: "Schema" },
                { id: "copy" as const, label: "Copy" },
                { id: "sections" as const, label: "Sections" },
                { id: "links" as const, label: "Links" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 text-xs py-2 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#E74C3C] text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-[#0F0F0F] border border-white/10 rounded-xl overflow-hidden">
              {/* Schema Tab */}
              {activeTab === "schema" && (
                <div className="p-4">
                  {assets?.schemaMarkup ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileJson className="w-4 h-4 text-[#E74C3C]" />
                          <span className="text-xs text-gray-400">
                            {assets.schemaMarkup.types.join(", ")}
                          </span>
                        </div>
                        <button
                          onClick={copySchema}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
                        >
                          {copiedSchema ? (
                            <><Check className="w-3 h-3 text-green-400" /> Copied</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copy</>
                          )}
                        </button>
                      </div>
                      <pre className="bg-[#1a1a1a] p-3 rounded-lg text-xs text-green-300 font-mono overflow-x-auto max-h-[400px] overflow-y-auto">
                        {assets.schemaMarkup.jsonLd}
                      </pre>
                      {assets.schemaMarkup.isValid && (
                        <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Valid JSON-LD
                        </div>
                      )}
                      {/* Schema Validation Button */}
                      <button
                        onClick={runSchemaValidation}
                        disabled={validatingSchema}
                        className="mt-3 w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {validatingSchema ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Validating...</>
                        ) : (
                          <><Zap className="w-3 h-3" /> Test Schema Against Schema.org</>
                        )}
                      </button>
                      {/* Validation Results */}
                      {schemaValidation && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Validation Score</span>
                            <span className={`text-sm font-mono font-bold ${
                              schemaValidation.score >= 80 ? "text-green-400" :
                              schemaValidation.score >= 50 ? "text-yellow-400" : "text-red-400"
                            }`}>
                              {schemaValidation.score}/100
                            </span>
                          </div>
                          {schemaValidation.errors.length > 0 && (
                            <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2 space-y-1">
                              {schemaValidation.errors.map((err, i) => (
                                <div key={i} className="text-[11px] text-red-400 flex items-start gap-1">
                                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                  <span><span className="font-mono text-red-500">{err.path}</span>: {err.message}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {schemaValidation.warnings.length > 0 && (
                            <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-2 space-y-1">
                              {schemaValidation.warnings.map((w, i) => (
                                <div key={i} className="text-[11px] text-yellow-400">
                                  <span className="font-mono">{w.property}</span>: {w.message}
                                </div>
                              ))}
                            </div>
                          )}
                          {schemaValidation.recommendations.length > 0 && (
                            <div className="space-y-1">
                              {schemaValidation.recommendations.map((r, i) => (
                                <div key={i} className="text-[11px] text-gray-500 flex items-start gap-1">
                                  <ArrowRight className="w-3 h-3 shrink-0 mt-0.5 text-blue-400" />
                                  {r}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-8">
                      No schema markup generated
                    </p>
                  )}
                </div>
              )}

              {/* Copy Tab */}
              {activeTab === "copy" && (
                <div className="p-4">
                  {assets?.rewrittenCopy ? (
                    <>
                      <div className="text-xs text-gray-500 mb-2">
                        {assets.rewrittenCopy.wordCount} words
                      </div>
                      <div className="prose prose-invert prose-sm max-h-[400px] overflow-y-auto text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {assets.rewrittenCopy.markdown.slice(0, 2000)}
                        {assets.rewrittenCopy.markdown.length > 2000 && (
                          <div className="text-center mt-4 text-xs text-gray-600">
                            Full content included in PDF brief
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-8">
                      No rewritten copy generated
                    </p>
                  )}
                </div>
              )}

              {/* Sections Tab */}
              {activeTab === "sections" && (
                <div className="p-4">
                  {assets?.contentSections && assets.contentSections.length > 0 ? (
                    <div className="space-y-4">
                      {assets.contentSections.map((section, i) => (
                        <div key={i}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                              {section.type}
                            </span>
                            <h4 className="text-sm font-medium text-white">{section.title}</h4>
                          </div>
                          <div className="text-xs text-gray-400 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                            {section.markdown.slice(0, 1500)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-8">
                      No content sections generated
                    </p>
                  )}
                </div>
              )}

              {/* Links Tab */}
              {activeTab === "links" && (
                <div className="p-4">
                  {assets?.internalLinks?.recommendations && assets.internalLinks.recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {/* Visual Sitemap Diagram */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Globe className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-gray-400 font-medium">Link Architecture</span>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-4 overflow-x-auto">
                          <svg
                            viewBox={`0 0 360 ${Math.max(200, 60 + assets.internalLinks.recommendations.length * 60)}`}
                            className="w-full"
                            style={{ minHeight: 200, maxHeight: 400 }}
                          >
                            {/* Central hub node — the user's domain */}
                            <circle cx="80" cy={30 + (assets.internalLinks.recommendations.length * 60) / 2} r="24" fill="#E74C3C" opacity="0.2" stroke="#E74C3C" strokeWidth="2" />
                            <text x="80" y={34 + (assets.internalLinks.recommendations.length * 60) / 2} textAnchor="middle" fill="#E74C3C" fontSize="9" fontFamily="monospace" fontWeight="bold">
                              {(() => { try { return new URL(data.domain || "").hostname.replace("www.", "").slice(0, 12); } catch { return "your site"; } })()}
                            </text>

                            {/* Link nodes + connections */}
                            {assets.internalLinks!.recommendations.map((link, i) => {
                              const centerY = 30 + (assets.internalLinks!.recommendations.length * 60) / 2;
                              const targetY = 40 + i * 60;
                              const targetX = 280;
                              return (
                                <g key={i}>
                                  {/* Curved connection line */}
                                  <path
                                    d={`M 104 ${centerY} C 180 ${centerY}, 200 ${targetY}, ${targetX - 50} ${targetY}`}
                                    fill="none"
                                    stroke="#6C5CE7"
                                    strokeWidth="1.5"
                                    opacity="0.5"
                                    strokeDasharray="4 2"
                                  />
                                  {/* Arrow */}
                                  <polygon
                                    points={`${targetX - 52},${targetY - 4} ${targetX - 44},${targetY} ${targetX - 52},${targetY + 4}`}
                                    fill="#6C5CE7"
                                    opacity="0.7"
                                  />
                                  {/* Target page node */}
                                  <rect x={targetX - 40} y={targetY - 16} width="100" height="32" rx="6" fill="#6C5CE7" opacity="0.15" stroke="#6C5CE7" strokeWidth="1" />
                                  <text x={targetX + 10} y={targetY + 4} textAnchor="middle" fill="#a29bfe" fontSize="8" fontFamily="monospace">
                                    {link.toPage.replace(/^https?:\/\//, "").slice(0, 14)}
                                  </text>
                                  {/* Anchor text label on the line */}
                                  <text x="170" y={Math.round((centerY + targetY) / 2) - 4} textAnchor="middle" fill="#636e72" fontSize="7" fontFamily="sans-serif">
                                    &quot;{link.anchorText.slice(0, 18)}&quot;
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>

                      {/* Link list */}
                      <div className="space-y-3">
                        {assets.internalLinks.recommendations.map((link, i) => (
                          <div key={i} className="border border-white/5 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-mono">
                                Link {i + 1}
                              </span>
                            </div>
                            <div className="text-sm text-white mb-1">
                              &quot;{link.anchorText}&quot;
                            </div>
                            <div className="text-xs text-blue-400 mb-1 truncate">
                              → {link.toPage}
                            </div>
                            <div className="text-xs text-gray-500">
                              {link.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-8">
                      No link recommendations generated
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Archetypes Section */}
        {archetypes.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-medium mb-4">Citation Archetypes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {archetypes.map((arch, i) => (
                <div
                  key={i}
                  className="bg-[#0F0F0F] border border-white/10 rounded-xl p-5 hover:border-blue-500/30 transition-colors"
                >
                  <h3 className="text-sm font-medium text-white mb-1">{arch.name}</h3>
                  <div className="text-xs text-blue-400 font-mono mb-3">
                    {arch.frequency}% of top pages
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{arch.description}</p>
                  <div className="space-y-1">
                    {arch.signals.map((s, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs">
                        <Check className="w-3 h-3 text-green-400" />
                        <span className="text-gray-400">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {data.patternResults && (
              <div className="mt-4 text-sm text-gray-500">
                Your domain matches{" "}
                <span className="text-white font-medium">
                  {data.patternResults.userArchetypeMatch}%
                </span>{" "}
                of the dominant archetype
              </div>
            )}
          </section>
        )}

        {/* Before / After Content Diff */}
        {assets?.rewrittenCopy && data.domainAnalysis?.page?.content && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E74C3C]" />
                Before &amp; After Preview
              </h2>
              <button
                onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
              >
                {showBeforeAfter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showBeforeAfter ? "Collapse" : "Expand"}
              </button>
            </div>
            {showBeforeAfter && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before: Current Content */}
                <div className="bg-[#0F0F0F] border border-red-500/20 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-red-500/5 border-b border-red-500/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs text-red-400 font-mono uppercase tracking-widest">Current Content</span>
                    <span className="text-[10px] text-gray-600 ml-auto">
                      {data.domainAnalysis.page.wordCount || "—"} words
                    </span>
                  </div>
                  <div className="p-4 max-h-[400px] overflow-y-auto">
                    <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap font-mono">
                      {data.domainAnalysis.page.content.slice(0, 3000)}
                      {data.domainAnalysis.page.content.length > 3000 && (
                        <span className="text-gray-600">... (truncated)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* After: Rewritten Content */}
                <div className="bg-[#0F0F0F] border border-green-500/20 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-green-500/5 border-b border-green-500/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-green-400 font-mono uppercase tracking-widest">Optimized Content</span>
                    <span className="text-[10px] text-gray-600 ml-auto">
                      {assets.rewrittenCopy.wordCount} words
                    </span>
                  </div>
                  <div className="p-4 max-h-[400px] overflow-y-auto">
                    <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {assets.rewrittenCopy.markdown.slice(0, 3000)}
                      {assets.rewrittenCopy.markdown.length > 3000 && (
                        <span className="text-gray-600">... (full version in PDF brief)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Collapsed Summary */}
            {!showBeforeAfter && (
              <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-gray-600">Current: </span>
                    <span className="text-red-400 font-mono">{data.domainAnalysis.page.wordCount || "—"} words</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600" />
                  <div>
                    <span className="text-gray-600">Optimized: </span>
                    <span className="text-green-400 font-mono">{assets.rewrittenCopy.wordCount} words</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600">Click expand to compare</div>
              </div>
            )}
          </section>
        )}

        {/* Competitor Citation Heatmap */}
        {data.extractionResults && data.extractionResults.pages.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Competitor Citation Heatmap
            </h2>
            <div className="bg-[#0F0F0F] border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-gray-500 font-mono uppercase tracking-widest px-4 py-3 text-[10px]">Domain</th>
                    <th className="text-center text-gray-500 font-mono uppercase tracking-widest px-3 py-3 text-[10px]">Schema</th>
                    <th className="text-center text-gray-500 font-mono uppercase tracking-widest px-3 py-3 text-[10px]">FAQ</th>
                    <th className="text-center text-gray-500 font-mono uppercase tracking-widest px-3 py-3 text-[10px]">Headings</th>
                    <th className="text-center text-gray-500 font-mono uppercase tracking-widest px-3 py-3 text-[10px]">Words</th>
                    <th className="text-center text-gray-500 font-mono uppercase tracking-widest px-3 py-3 text-[10px]">Entities</th>
                    <th className="text-center text-gray-500 font-mono uppercase tracking-widest px-3 py-3 text-[10px]">Cited</th>
                  </tr>
                </thead>
                <tbody>
                  {data.extractionResults.pages.map((page, i) => {
                    let host = "unknown";
                    try { host = new URL(page.url).hostname.replace("www.", ""); } catch { /* skip */ }
                    const schemaCount = page.schemaMarkup?.length || 0;
                    const faqCount = page.faqSections?.length || 0;
                    const headingCount = page.headings?.length || 0;
                    const wordCount = page.wordCount || 0;
                    const entityCount = page.entityMentions?.length || 0;
                    const citedUrl = citedUrls.find((u) => {
                      try { return new URL(u.url).hostname.replace("www.", "") === host; } catch { return false; }
                    });
                    const citationCount = citedUrl?.citationCount || 0;

                    const heatCell = (value: number, thresholds: [number, number]) => {
                      if (value >= thresholds[1]) return "bg-green-500/20 text-green-400";
                      if (value >= thresholds[0]) return "bg-yellow-500/20 text-yellow-400";
                      return "bg-red-500/20 text-red-400";
                    };

                    // Check if this is the user's domain
                    const userHost = (() => {
                      try { return new URL(data.domain || "").hostname.replace("www.", ""); } catch { return ""; }
                    })();
                    const isUserDomain = host === userHost;

                    return (
                      <tr
                        key={i}
                        className={`border-b border-white/5 ${isUserDomain ? "bg-[#E74C3C]/5 border-l-2 border-l-[#E74C3C]" : "hover:bg-white/[0.02]"}`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${host}&sz=16`}
                              alt=""
                              width={14}
                              height={14}
                              className="rounded"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                            <span className={`font-mono truncate max-w-[140px] ${isUserDomain ? "text-[#E74C3C] font-bold" : "text-gray-300"}`}>
                              {host}
                            </span>
                            {isUserDomain && (
                              <span className="text-[8px] bg-[#E74C3C]/20 text-[#E74C3C] px-1.5 py-0.5 rounded-full">YOU</span>
                            )}
                          </div>
                        </td>
                        <td className={`text-center px-3 py-2.5 rounded ${heatCell(schemaCount, [1, 2])}`}>
                          {schemaCount > 0 ? `${schemaCount} type${schemaCount > 1 ? "s" : ""}` : "—"}
                        </td>
                        <td className={`text-center px-3 py-2.5 rounded ${heatCell(faqCount, [1, 3])}`}>
                          {faqCount > 0 ? `${faqCount} Q&A` : "—"}
                        </td>
                        <td className={`text-center px-3 py-2.5 rounded ${heatCell(headingCount, [3, 6])}`}>
                          {headingCount}
                        </td>
                        <td className={`text-center px-3 py-2.5 rounded ${heatCell(wordCount, [500, 1500])}`}>
                          {wordCount > 0 ? wordCount.toLocaleString() : "—"}
                        </td>
                        <td className={`text-center px-3 py-2.5 rounded ${heatCell(entityCount, [3, 8])}`}>
                          {entityCount}
                        </td>
                        <td className="text-center px-3 py-2.5">
                          <span className="text-[#E74C3C] font-mono font-bold">{citationCount}×</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Legend */}
              <div className="px-4 py-2.5 border-t border-white/5 flex items-center gap-4 text-[10px] text-gray-600">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/40"></span> Strong</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500/40"></span> Average</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/40"></span> Weak / Missing</span>
              </div>
            </div>
          </section>
        )}

        {/* Competitor Benchmarking Bar Charts */}
        {data.extractionResults && data.extractionResults.pages.length > 1 && (() => {
          const pages = data.extractionResults!.pages;
          const userHost = (() => {
            try { return new URL(data.domain || "").hostname.replace("www.", ""); } catch { return ""; }
          })();

          const metrics = pages.map((p) => {
            let host = "unknown";
            try { host = new URL(p.url).hostname.replace("www.", ""); } catch { /* skip */ }
            return {
              host,
              isUser: host === userHost,
              schema: p.schemaMarkup?.length || 0,
              faq: p.faqSections?.length || 0,
              headings: p.headings?.length || 0,
              words: p.wordCount || 0,
              entities: p.entityMentions?.length || 0,
            };
          }).sort((a, b) => (b.schema + b.faq + b.headings + b.entities) - (a.schema + a.faq + a.headings + a.entities)).slice(0, 8);

          const maxWords = Math.max(...metrics.map(m => m.words), 1);
          const maxHeadings = Math.max(...metrics.map(m => m.headings), 1);
          const maxEntities = Math.max(...metrics.map(m => m.entities), 1);
          const maxFaq = Math.max(...metrics.map(m => m.faq), 1);

          const charts: { label: string; key: "words" | "headings" | "entities" | "faq"; max: number; color: string; format: (v: number) => string }[] = [
            { label: "Word Count", key: "words", max: maxWords, color: "#3B82F6", format: (v) => v.toLocaleString() },
            { label: "Headings", key: "headings", max: maxHeadings, color: "#10B981", format: (v) => String(v) },
            { label: "Entity Mentions", key: "entities", max: maxEntities, color: "#F59E0B", format: (v) => String(v) },
            { label: "FAQ Items", key: "faq", max: maxFaq, color: "#8B5CF6", format: (v) => String(v) },
          ];

          return (
            <section className="mt-12">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Competitor Benchmarking
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {charts.map((chart) => (
                  <div key={chart.key} className="bg-[#0F0F0F] border border-white/10 rounded-xl p-5">
                    <h3 className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-4">{chart.label}</h3>
                    <div className="space-y-2">
                      {metrics.map((m, i) => {
                        const pct = chart.max > 0 ? (m[chart.key] / chart.max) * 100 : 0;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <div className={`text-[10px] font-mono truncate w-24 text-right ${m.isUser ? "text-[#E74C3C] font-bold" : "text-gray-500"}`}>
                              {m.host.length > 14 ? m.host.slice(0, 12) + "…" : m.host}
                            </div>
                            <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden relative">
                              <div
                                className="h-full rounded transition-all duration-500"
                                style={{
                                  width: `${Math.max(pct, 2)}%`,
                                  backgroundColor: m.isUser ? "#E74C3C" : chart.color,
                                  opacity: m.isUser ? 1 : 0.5,
                                }}
                              />
                            </div>
                            <div className={`text-[10px] font-mono w-12 text-right ${m.isUser ? "text-white font-bold" : "text-gray-600"}`}>
                              {chart.format(m[chart.key])}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Freshness Overview */}
        {citedUrls.some(u => u.publishedDate) && (
          <section className="mt-12">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Content Freshness
            </h2>
            <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-5">
              <div className="grid grid-cols-3 gap-4 mb-4">
                {(() => {
                  const datesInDays = citedUrls
                    .filter(u => u.publishedDate)
                    .map(u => Math.floor((Date.now() - new Date(u.publishedDate!).getTime()) / (1000 * 60 * 60 * 24)));
                  const fresh = datesInDays.filter(d => d < 90).length;
                  const aging = datesInDays.filter(d => d >= 90 && d < 365).length;
                  const stale = datesInDays.filter(d => d >= 365).length;
                  return (
                    <>
                      <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3 text-center">
                        <div className="text-2xl font-mono font-bold text-green-400">{fresh}</div>
                        <div className="text-[10px] text-gray-500 uppercase mt-1">Fresh (&lt;90d)</div>
                      </div>
                      <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3 text-center">
                        <div className="text-2xl font-mono font-bold text-yellow-400">{aging}</div>
                        <div className="text-[10px] text-gray-500 uppercase mt-1">Aging (90d–1y)</div>
                      </div>
                      <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 text-center">
                        <div className="text-2xl font-mono font-bold text-red-400">{stale}</div>
                        <div className="text-[10px] text-gray-500 uppercase mt-1">Stale (&gt;1y)</div>
                      </div>
                    </>
                  );
                })()}
              </div>
              {/* Freshness timeline bars */}
              <div className="space-y-1.5">
                {citedUrls.filter(u => u.publishedDate).slice(0, 10).map((url, i) => {
                  const fresh = getFreshness(url.publishedDate);
                  let host = "unknown";
                  try { host = new URL(url.url).hostname.replace("www.", ""); } catch { /* skip */ }
                  const days = url.publishedDate ? Math.floor((Date.now() - new Date(url.publishedDate).getTime()) / (1000 * 60 * 60 * 24)) : 999;
                  const barWidth = Math.max(5, Math.min(100, 100 - (days / 365) * 100));
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500 font-mono w-28 truncate">{host}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            fresh.color === "text-green-400" ? "bg-green-500" :
                            fresh.color === "text-yellow-400" ? "bg-yellow-500" :
                            fresh.color === "text-orange-400" ? "bg-orange-500" : "bg-red-500"
                          }`}
                          style={{ width: `${barWidth}%`, opacity: 0.6 }}
                        />
                      </div>
                      <span className={`text-[10px] font-mono ${fresh.color} w-14 text-right`}>{fresh.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Advanced Research Insights (from Advanced Agent) */}
        {data.advancedResearch && (
          <section className="mt-12">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Advanced Agent Research Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Contradictions */}
              {data.advancedResearch.contradictions.length > 0 && (
                <div className="bg-[#0F0F0F] border border-orange-500/20 rounded-xl p-5">
                  <h3 className="text-xs text-orange-400 uppercase tracking-widest mb-3 font-mono flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Source Contradictions
                  </h3>
                  <div className="space-y-2">
                    {data.advancedResearch.contradictions.map((c, i) => (
                      <div key={i} className="text-xs text-gray-400 border-l-2 border-orange-500/30 pl-3">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Knowledge Gaps */}
              {data.advancedResearch.knowledgeGaps.length > 0 && (
                <div className="bg-[#0F0F0F] border border-yellow-500/20 rounded-xl p-5">
                  <h3 className="text-xs text-yellow-400 uppercase tracking-widest mb-3 font-mono flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Knowledge Gaps (Opportunities)
                  </h3>
                  <div className="space-y-2">
                    {data.advancedResearch.knowledgeGaps.map((g, i) => (
                      <div key={i} className="text-xs text-gray-400 border-l-2 border-yellow-500/30 pl-3">
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Opportunities */}
              {data.advancedResearch.contentOpportunities.length > 0 && (
                <div className="bg-[#0F0F0F] border border-green-500/20 rounded-xl p-5">
                  <h3 className="text-xs text-green-400 uppercase tracking-widest mb-3 font-mono flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Content Opportunities
                  </h3>
                  <div className="space-y-2">
                    {data.advancedResearch.contentOpportunities.map((o, i) => (
                      <div key={i} className="text-xs text-gray-400 border-l-2 border-green-500/30 pl-3">
                        {o}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* API Transparency */}
        <section className="mt-12">
          <button
            onClick={() => setShowApiDetails(!showApiDetails)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-400 transition-colors"
          >
            {showApiDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <Activity className="w-4 h-4" />
            You.com & Foxit Data Transparency
          </button>
          {showApiDetails && (
            <div className="mt-4 bg-[#0F0F0F] border border-white/10 rounded-xl p-5 space-y-4">
              {/* API Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/[0.02] rounded-lg p-3 text-center">
                  <div className="text-2xl font-mono font-bold text-white">
                    {data.apiTracking?.totalCalls || "—"}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Total API Calls</div>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-3 text-center">
                  <div className="text-2xl font-mono font-bold text-white">
                    {data.apiTracking ? `${(data.apiTracking.totalDurationMs / 1000).toFixed(1)}s` : "—"}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Total Duration</div>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-3 text-center">
                  <div className="text-2xl font-mono font-bold text-blue-400">3</div>
                  <div className="text-[10px] text-gray-500 uppercase">You.com APIs</div>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-3 text-center">
                  <div className="text-2xl font-mono font-bold text-green-400">
                    {data.apiTracking?.calls.filter(c => c.api.startsWith("foxit")).length || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Foxit API Calls</div>
                </div>
              </div>

              {/* API Breakdown */}
              <div className="text-xs space-y-2">
                <div className="text-gray-400 font-medium">APIs Used:</div>
                <div className="flex flex-wrap gap-2">
                  {["You.com Search API", "You.com Contents API (livecrawl)", "You.com Express Agent", "You.com Advanced Agent", "Foxit PDF Services"].map((api, i) => (
                    <span key={i} className="px-2 py-1 bg-white/5 rounded text-gray-400 border border-white/5">
                      {api}
                    </span>
                  ))}
                </div>
              </div>

              {/* Query Variants */}
              <div className="text-xs">
                <div className="text-gray-400 font-medium mb-1">Search Queries Executed:</div>
                <div className="space-y-1">
                  {data.discoveryResults?.queryVariants?.map((q, i) => (
                    <div key={i} className="text-gray-500 font-mono pl-2 border-l border-white/10">
                      &quot;{q}&quot;
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual API Calls Log */}
              {data.apiTracking?.calls && data.apiTracking.calls.length > 0 && (
                <div className="text-xs">
                  <div className="text-gray-400 font-medium mb-2">API Call Log:</div>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {data.apiTracking.calls.map((call, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-600 font-mono py-0.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className={`shrink-0 ${call.status === "success" ? "text-green-500" : "text-red-500"}`}>
                          {call.status === "success" ? "✓" : "✗"}
                        </span>
                        <span className="text-gray-400 shrink-0">{call.api}</span>
                        <span className="truncate">{call.details}</span>
                        <span className="text-gray-700 ml-auto shrink-0">{call.durationMs}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Citations */}
              <div className="pt-2 border-t border-white/5 text-xs">
                <div className="text-gray-400 font-medium mb-1">All Cited URLs ({citedUrls.length}):</div>
                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                  {citedUrls.map((u, i) => (
                    <div key={i} className="text-gray-600 font-mono">{u.url} (cited {u.citationCount}×)</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
