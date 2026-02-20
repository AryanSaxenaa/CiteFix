"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Search,
  FileText,
  Globe,
  Cpu,
  Wand2,
  Check,
  Loader2,
  AlertCircle,
  Brain,
} from "lucide-react";
import Link from "next/link";

interface StageInfo {
  id: number;
  label: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
}

const STAGES: StageInfo[] = [
  {
    id: 1,
    label: "Citation Discovery",
    description: "Querying You.com Search API for top-cited pages...",
    icon: <Search className="w-5 h-5" />,
    endpoint: "discover",
  },
  {
    id: 2,
    label: "Content Extraction",
    description: "Extracting live content via You.com Contents API...",
    icon: <FileText className="w-5 h-5" />,
    endpoint: "extract",
  },
  {
    id: 3,
    label: "Pattern Analysis",
    description: "Running citation pattern analysis...",
    icon: <Cpu className="w-5 h-5" />,
    endpoint: "patterns",
  },
  {
    id: 4,
    label: "Deep Research",
    description: "You.com Advanced Agent researching contradictions & gaps...",
    icon: <Brain className="w-5 h-5" />,
    endpoint: "research",
  },
  {
    id: 5,
    label: "Asset Generation",
    description: "Generating deployment-ready assets via You.com Express Agent...",
    icon: <Wand2 className="w-5 h-5" />,
    endpoint: "generate",
  },
  {
    id: 6,
    label: "Brief Generation",
    description: "Creating PDF brief via Foxit PDF Services...",
    icon: <FileText className="w-5 h-5" />,
    endpoint: "pdf",
  },
];

export default function LoadingPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const [currentStage, setCurrentStage] = useState(0);
  const [stageResults, setStageResults] = useState<Record<number, unknown>>({});
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const hasStarted = useRef(false);

  const runStage = useCallback(
    async (stage: StageInfo): Promise<boolean> => {
      try {
        const res = await fetch(`/api/analyze/${jobId}/${stage.endpoint}`, {
          method: "POST",
        });
        const data = await res.json();

        if (!res.ok) {
          // PDF failures are non-critical
          if (stage.endpoint === "pdf") {
            setStageResults((prev) => ({ ...prev, [stage.id]: { partial: true } }));
            return true;
          }
          throw new Error(data.error || `Stage ${stage.id} failed`);
        }

        setStageResults((prev) => ({ ...prev, [stage.id]: data }));
        return true;
      } catch (err) {
        if (stage.endpoint === "pdf") {
          return true; // PDF is optional
        }
        throw err;
      }
    },
    [jobId]
  );

  const runPipeline = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    try {
      for (const stage of STAGES) {
        setCurrentStage(stage.id);
        await runStage(stage);
      }
      // Pipeline complete — navigate to results
      router.push(`/analyze/${jobId}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, jobId, router, runStage]);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      runPipeline();
    }
  }, [runPipeline]);

  const getStageStatus = (stageId: number) => {
    if (stageResults[stageId]) return "complete";
    if (stageId === currentStage && !error) return "running";
    if (stageId < currentStage) return "complete";
    return "pending";
  };

  // Extract preview data from results  
  const discoveryData = stageResults[1] as { discoveryResults?: { citedUrls: { url: string; title: string; citationCount: number }[] } } | undefined;
  const extractData = stageResults[2] as { extractedCount?: number; domainAnalysis?: { citationStatus: string; contentDepth: number } } | undefined;
  const patternData = stageResults[3] as { patternResults?: { citationProbabilityScore: number; archetypes: { name: string }[] } } | undefined;
  const researchData = stageResults[4] as { advancedResearch?: { contradictions: number; knowledgeGaps: number; contentOpportunities: number }; partial?: boolean } | undefined;

  return (
    <div className="relative min-h-screen text-white font-sans bg-bg-dark">
      <div className="fixed inset-0 bg-grid pointer-events-none z-0"></div>
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Nav */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-full pl-6 pr-2 py-2 flex items-center gap-8 shadow-2xl shadow-black/50">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Scoutlytics" className="w-[100px] h-[100px] object-contain" />
            <span className="font-serif font-bold text-lg tracking-tight">Scoutlytics</span>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Progress */}
          <div>
            <h1 className="text-3xl font-serif mb-2">Analyzing Citations</h1>
            <p className="text-gray-500 text-sm mb-8 font-mono">Job: {jobId}</p>

            {/* Progress bar */}
            <div className="h-2 bg-[#1a1a1a] rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E74C3C] to-red-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(currentStage / STAGES.length) * 100}%` }}
              ></div>
            </div>

            {/* Stage list */}
            <div className="space-y-4">
              {STAGES.map((stage) => {
                const status = getStageStatus(stage.id);
                return (
                  <div
                    key={stage.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                      status === "running"
                        ? "bg-[#E74C3C]/5 border-[#E74C3C]/30"
                        : status === "complete"
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-[#0F0F0F] border-white/5"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        status === "running"
                          ? "bg-[#E74C3C]/20 text-[#E74C3C]"
                          : status === "complete"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-[#1a1a1a] text-gray-600"
                      }`}
                    >
                      {status === "running" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : status === "complete" ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        stage.icon
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium ${
                          status === "pending" ? "text-gray-600" : "text-white"
                        }`}
                      >
                        {stage.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {status === "running"
                          ? stage.description
                          : status === "complete"
                          ? "Complete"
                          : "Waiting..."}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm text-red-400 font-medium">Analysis Error</div>
                  <div className="text-xs text-red-400/70 mt-1">{error}</div>
                  <button
                    onClick={() => {
                      setError("");
                      hasStarted.current = false;
                      runPipeline();
                    }}
                    className="mt-3 text-xs bg-red-500/20 px-3 py-1 rounded text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Preview */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-400 mb-4">Live Preview</h2>

            {/* Discovery preview */}
            {discoveryData?.discoveryResults && (
              <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-5 animate-fadeIn">
                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-mono">
                  Top Cited Pages
                </h3>
                <div className="space-y-2">
                  {discoveryData.discoveryResults.citedUrls.slice(0, 5).map((u, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm p-2 rounded bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="w-3 h-3 text-gray-600 shrink-0" />
                        <span className="text-gray-300 truncate">
                          {u.title || new URL(u.url).hostname}
                        </span>
                      </div>
                      <span className="text-[#E74C3C] text-xs font-mono shrink-0 ml-2">
                        {u.citationCount}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extraction preview */}
            {extractData?.domainAnalysis && (
              <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-5 animate-fadeIn">
                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-mono">
                  Your Domain
                </h3>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      extractData.domainAnalysis.citationStatus === "cited"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-300">
                    {extractData.domainAnalysis.citationStatus === "cited"
                      ? "Currently cited by AI engines"
                      : "Not currently cited"}
                  </span>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  {extractData.extractedCount} pages extracted successfully
                </div>
              </div>
            )}

            {/* Pattern preview */}
            {patternData?.patternResults && (
              <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-5 animate-fadeIn">
                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-mono">
                  Citation Probability Score
                </h3>
                <div className="flex items-center gap-4">
                  <div
                    className={`text-4xl font-mono font-bold ${
                      patternData.patternResults.citationProbabilityScore < 40
                        ? "text-red-400"
                        : patternData.patternResults.citationProbabilityScore < 70
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {patternData.patternResults.citationProbabilityScore}
                  </div>
                  <div className="text-sm text-gray-500">/ 100</div>
                </div>
                {patternData.patternResults.archetypes[0] && (
                  <div className="mt-3 text-xs text-gray-500">
                    Dominant archetype:{" "}
                    <span className="text-gray-300">
                      {patternData.patternResults.archetypes[0].name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Research preview */}
            {researchData?.advancedResearch && (
              <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-5 animate-fadeIn">
                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-mono">
                  <Brain className="w-3 h-3 inline mr-1" />
                  Advanced Agent Research
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Contradictions Found</span>
                    <span className="text-orange-400 font-mono">{researchData.advancedResearch.contradictions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Knowledge Gaps</span>
                    <span className="text-yellow-400 font-mono">{researchData.advancedResearch.knowledgeGaps}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Content Opportunities</span>
                    <span className="text-green-400 font-mono">{researchData.advancedResearch.contentOpportunities}</span>
                  </div>
                </div>
                {researchData.partial && (
                  <div className="mt-2 text-xs text-gray-600">Partial results — some research may be limited</div>
                )}
              </div>
            )}

            {/* Placeholder while waiting */}
            {!discoveryData?.discoveryResults && (
              <div className="bg-[#0F0F0F] border border-white/5 rounded-xl p-8 text-center">
                <div className="text-gray-700 text-sm">
                  Results will appear here as each stage completes...
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
