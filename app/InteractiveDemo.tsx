"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface DemoLine {
  icon: "spinner" | "check" | "error";
  text: string;
  detail?: string;
}

interface DemoResult {
  score: number;
  gaps: number;
  assets: number;
  cited: number;
  found: boolean;
  topGap?: string;
}

export default function InteractiveDemo() {
  const [domain, setDomain] = useState("");
  const [topic, setTopic] = useState("");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<DemoLine[]>([]);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, result]);

  const addLine = (line: DemoLine) => {
    setLines((prev) => [...prev, line]);
  };

  const updateLastLine = (update: Partial<DemoLine>) => {
    setLines((prev) => {
      const copy = [...prev];
      if (copy.length > 0) {
        copy[copy.length - 1] = { ...copy[copy.length - 1], ...update };
      }
      return copy;
    });
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const pollStage = async (id: string, stage: number): Promise<boolean> => {
    for (let i = 0; i < 60; i++) {
      await sleep(1500);
      try {
        const res = await fetch(`/api/analyze/${id}`);
        if (!res.ok) return false;
        const data = await res.json();
        if (data.status === "failed") return false;
        if (data.stage >= stage) return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const runDemo = async () => {
    if (!domain.trim() || !topic.trim()) return;

    setRunning(true);
    setLines([]);
    setResult(null);
    setJobId(null);

    // Step 1: Create analysis
    addLine({ icon: "spinner", text: "Starting analysis...", detail: "" });

    try {
      const createRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain.trim(),
          topic: topic.trim(),
          config: { depth: "quick", sourceTypes: ["web"], outputFormat: "json", competitors: [], country: "US" },
        }),
      });

      if (!createRes.ok) {
        updateLastLine({ icon: "error", text: "Failed to start analysis", detail: "API error" });
        setRunning(false);
        return;
      }

      const { jobId: id } = await createRes.json();
      setJobId(id);
      updateLastLine({ icon: "check", text: "Analysis created", detail: `Job ${id.slice(0, 12)}…` });

      // Step 2: Discover
      addLine({ icon: "spinner", text: "Querying You.com Search API...", detail: "" });
      await fetch(`/api/analyze/${id}/discover`, { method: "POST" });
      const discovered = await pollStage(id, 2);
      if (!discovered) {
        updateLastLine({ icon: "error", text: "Discovery failed", detail: "" });
        setRunning(false);
        return;
      }
      updateLastLine({ icon: "check", text: "Search results collected", detail: "Done" });

      // Step 3: Extract
      addLine({ icon: "spinner", text: "Extracting citation patterns...", detail: "" });
      await fetch(`/api/analyze/${id}/extract`, { method: "POST" });
      const extracted = await pollStage(id, 3);
      if (!extracted) {
        updateLastLine({ icon: "error", text: "Extraction failed", detail: "" });
        setRunning(false);
        return;
      }
      updateLastLine({ icon: "check", text: "Citation data extracted", detail: "Done" });

      // Step 4: Patterns
      addLine({ icon: "spinner", text: "Analyzing patterns & gaps...", detail: "" });
      await fetch(`/api/analyze/${id}/patterns`, { method: "POST" });
      const patterned = await pollStage(id, 4);
      if (!patterned) {
        updateLastLine({ icon: "error", text: "Pattern analysis failed", detail: "" });
        setRunning(false);
        return;
      }
      updateLastLine({ icon: "check", text: "Patterns identified", detail: "Done" });

      // Step 5: Generate
      addLine({ icon: "spinner", text: "Generating implementation assets...", detail: "" });
      await fetch(`/api/analyze/${id}/generate`, { method: "POST" });
      const generated = await pollStage(id, 5);
      if (!generated) {
        updateLastLine({ icon: "error", text: "Generation failed", detail: "" });
        setRunning(false);
        return;
      }
      updateLastLine({ icon: "check", text: "Assets generated", detail: "Done" });

      // Get final results
      addLine({ icon: "spinner", text: "Compiling results...", detail: "" });
      await sleep(500);
      const finalRes = await fetch(`/api/analyze/${id}`);
      if (finalRes.ok) {
        const data = await finalRes.json();
        updateLastLine({ icon: "check", text: "Analysis complete!", detail: "" });
        setResult({
          score: data.results?.scoring?.current ?? 0,
          gaps: data.results?.gaps?.length ?? 0,
          assets: data.generatedAssets ? Object.keys(data.generatedAssets).filter((k: string) => data.generatedAssets[k]).length : 0,
          cited: data.results?.citedUrls?.length ?? 0,
          found: data.results?.citedUrls?.some((u: { url: string }) => u.url.includes(domain.replace(/^https?:\/\//, "").replace("www.", ""))) ?? false,
          topGap: data.results?.gaps?.[0]?.title,
        });
      }
    } catch (err) {
      updateLastLine({ icon: "error", text: "Something went wrong", detail: String(err) });
    }

    setRunning(false);
  };

  return (
    <section id="demo" className="py-24 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <span className="text-[#E74C3C] font-mono text-xs uppercase tracking-widest">
          See It In Action
        </span>
        <h2 className="text-4xl mt-2 font-serif">Try the engine right now</h2>
        <p className="text-gray-400 mt-4 max-w-lg mx-auto">
          Enter any domain and topic — watch Scoutlytics run a real analysis in real time. No signup needed.
        </p>
      </div>

      <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0c0c0c]">
        {/* Title bar */}
        <div className="bg-[#1a1a1a] px-4 py-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-xs text-gray-500 font-mono">scoutlytics — live demo</div>
          <div className="w-10"></div>
        </div>

        {/* Input area */}
        <div className="p-6 border-b border-white/5 bg-[#111]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-gray-600 font-mono uppercase mb-1 block">Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yoursite.com"
                disabled={running}
                className="w-full bg-[#0c0c0c] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-700 font-mono focus:outline-none focus:border-[#E74C3C]/50 disabled:opacity-50"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-600 font-mono uppercase mb-1 block">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="best project management tools"
                disabled={running}
                className="w-full bg-[#0c0c0c] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-700 font-mono focus:outline-none focus:border-[#E74C3C]/50 disabled:opacity-50"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={runDemo}
                disabled={running || !domain.trim() || !topic.trim()}
                className="bg-[#E74C3C] hover:bg-red-600 text-white px-6 py-2 rounded text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                {running ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...
                  </>
                ) : (
                  "Run Analysis"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Terminal output */}
        <div ref={scrollRef} className="p-6 font-mono text-sm h-[320px] overflow-y-auto">
          {lines.length === 0 && !running && (
            <div className="text-gray-600 text-center py-12">
              <p className="mb-1">// Enter a domain and topic above, then click &quot;Run Analysis&quot;</p>
              <p className="text-gray-700">// Full 5-stage pipeline runs in ~30 seconds</p>
            </div>
          )}

          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="flex gap-2 items-start">
                {line.icon === "spinner" && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin mt-0.5 shrink-0" />}
                {line.icon === "check" && <span className="text-green-500 shrink-0">✔</span>}
                {line.icon === "error" && <span className="text-red-500 shrink-0">✖</span>}
                <span className="text-gray-300">{line.text}</span>
                {line.detail && <span className="text-gray-600">{line.detail}</span>}
              </div>
            ))}
          </div>

          {/* Results panel */}
          {result && (
            <div className="mt-4 p-4 border border-white/10 bg-white/5 rounded">
              <div className="text-[#E74C3C] font-bold mb-3">
                ANALYSIS COMPLETE — SCORE: {result.score}/100
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div className="text-center">
                  <div className={`text-xl font-bold ${result.score >= 70 ? "text-green-400" : result.score >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                    {result.score}
                  </div>
                  <div className="text-[9px] text-gray-600 uppercase">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-400">{result.gaps}</div>
                  <div className="text-[9px] text-gray-600 uppercase">Gaps Found</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-400">{result.cited}</div>
                  <div className="text-[9px] text-gray-600 uppercase">URLs Cited</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-400">{result.assets}</div>
                  <div className="text-[9px] text-gray-600 uppercase">Assets</div>
                </div>
              </div>
              {result.topGap && (
                <div className="text-gray-400 text-xs mb-3">
                  Top gap: <span className="text-white">{result.topGap}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                {result.found ? (
                  <span className="text-green-400">✔ Your domain was found in AI results</span>
                ) : (
                  <span className="text-yellow-400">⚠ Your domain was not detected in AI citations</span>
                )}
              </div>
              {jobId && (
                <a
                  href={`/analyze/${jobId}/results`}
                  className="inline-block bg-[#E74C3C] hover:bg-red-600 text-white px-4 py-2 rounded text-xs transition-colors font-bold"
                >
                  View Full Results →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
