"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Globe,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  Loader2,
  Lightbulb,
  Shield,
  Map,
  FileText,
  Newspaper,
  Users,
} from "lucide-react";
import Link from "next/link";

const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "IN", label: "India" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "CA", label: "Canada" },
];

interface DnsValidation {
  valid: boolean;
  reachable: boolean;
  hostname: string;
  sitemapFound: boolean;
  sitemapUrl?: string;
  robotsTxtFound: boolean;
  pageCount?: number;
  dnsResolveMs?: number;
  error?: string;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [topic, setTopic] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [depth, setDepth] = useState<"quick" | "standard" | "deep">("standard");
  const [country, setCountry] = useState("US");
  const [sourceTypes, setSourceTypes] = useState<("web" | "news")[]>(["web"]);
  const [outputFormat, setOutputFormat] = useState<"pdf" | "json" | "both">("both");
  const [competitors, setCompetitors] = useState(["", "", ""]);
  const [brandVoiceSamples, setBrandVoiceSamples] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [domainValid, setDomainValid] = useState<boolean | null>(null);

  // DNS validation state
  const [dnsResult, setDnsResult] = useState<DnsValidation | null>(null);
  const [validatingDns, setValidatingDns] = useState(false);
  const dnsDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Topic suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // DNS validation — real-time
  const validateDns = useCallback(async (domainValue: string) => {
    if (domainValue.trim().length < 3) {
      setDnsResult(null);
      return;
    }
    setValidatingDns(true);
    try {
      const res = await fetch("/api/analyze/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainValue.trim() }),
      });
      const data: DnsValidation = await res.json();
      setDnsResult(data);
      setDomainValid(data.valid && data.reachable);
    } catch {
      setDnsResult(null);
    } finally {
      setValidatingDns(false);
    }
  }, []);

  const handleDomainChange = (value: string) => {
    setDomain(value);
    // Basic instant validation
    if (!value.trim()) {
      setDomainValid(null);
      setDnsResult(null);
      return;
    }
    try {
      const url = value.startsWith("http") ? value : `https://${value}`;
      new URL(url);
      setDomainValid(true); // optimistic
    } catch {
      setDomainValid(false);
      setDnsResult(null);
      return;
    }
    // Debounced DNS check
    if (dnsDebounce.current) clearTimeout(dnsDebounce.current);
    dnsDebounce.current = setTimeout(() => validateDns(value), 600);
  };

  const toggleSourceType = (type: "web" | "news") => {
    setSourceTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // Must have at least one
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const fetchSuggestions = useCallback(async (topicValue: string) => {
    if (topicValue.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const res = await fetch("/api/analyze/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicValue.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch {
      // Silently fail — suggestions are optional
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (suggestDebounce.current) clearTimeout(suggestDebounce.current);
    if (topic.trim().length >= 3) {
      suggestDebounce.current = setTimeout(() => fetchSuggestions(topic), 800);
    } else {
      setSuggestions([]);
    }
    return () => {
      if (suggestDebounce.current) clearTimeout(suggestDebounce.current);
    };
  }, [topic, fetchSuggestions]);

  const toggleSuggestion = (suggestion: string) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(suggestion)) {
        next.delete(suggestion);
      } else {
        next.add(suggestion);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!domain.trim() || !topic.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain.trim(),
          topic: topic.trim(),
          intentVariants: Array.from(selectedSuggestions),
          config: {
            depth,
            country,
            sourceTypes,
            outputFormat,
            competitors: competitors.filter((c) => c.trim()),
            brandVoiceSamples: brandVoiceSamples.filter((s) => s.trim()),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create analysis");

      router.push(`/analyze/${data.jobId}/loading`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const depthInfo = {
    quick: { label: "Quick", pages: 5, time: "~30s" },
    standard: { label: "Standard", pages: 10, time: "~60s" },
    deep: { label: "Deep", pages: 20, time: "~90s" },
  };

  const canSubmit = domain.trim() && topic.trim() && domainValid !== false && !loading;

  return (
    <div className="relative min-h-screen text-white font-sans bg-bg-dark">
      <div className="fixed inset-0 bg-grid pointer-events-none z-0"></div>
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Nav */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-full pl-6 pr-2 py-2 flex items-center gap-8 shadow-2xl shadow-black/50">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Scoutlytics" className="w-10 h-10 object-contain" />
            <span className="font-serif font-bold text-lg tracking-tight">Scoutlytics</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors">
              ← Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-xs text-red-400 font-mono mb-6">
            <Zap className="w-3 h-3" />
            CITATION ANALYSIS ENGINE
          </div>
          <h1 className="text-4xl md:text-5xl font-serif mb-4">
            Analyze Your Citations
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Enter your domain and target topic to discover how AI engines cite your
            competitors — and get deployment-ready fixes.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-8 space-y-6">
          {/* Domain Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Your Domain
            </label>
            <div className="relative">
              <input
                type="text"
                value={domain}
                onChange={(e) => handleDomainChange(e.target.value)}
                placeholder="e.g. nike.com"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E74C3C]/50 focus:ring-1 focus:ring-[#E74C3C]/20 transition-all"
              />
              {(domainValid !== null || validatingDns) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validatingDns ? (
                    <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                  ) : domainValid ? (
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 text-xs">✓</span>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-red-400 text-xs">✗</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DNS Validation Details */}
            {dnsResult && (
              <div className="mt-3 space-y-2">
                {dnsResult.reachable ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-[11px] text-green-400">
                      <Shield className="w-3 h-3" /> Reachable
                      {dnsResult.dnsResolveMs ? ` (${dnsResult.dnsResolveMs}ms)` : ""}
                    </span>
                    {dnsResult.robotsTxtFound && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-400">
                        <FileText className="w-3 h-3" /> robots.txt
                      </span>
                    )}
                    {dnsResult.sitemapFound && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-400">
                        <Map className="w-3 h-3" /> Sitemap
                        {dnsResult.pageCount ? ` (${dnsResult.pageCount.toLocaleString()} pages)` : ""}
                      </span>
                    )}
                  </div>
                ) : dnsResult.error ? (
                  <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                    {dnsResult.error}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Topic Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Search className="w-4 h-4 inline mr-2" />
              Target Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. vegan trail running shoes, B2B CRM software, home equity loans"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E74C3C]/50 focus:ring-1 focus:ring-[#E74C3C]/20 transition-all"
            />

            {/* AI-generated intent suggestions */}
            {(loadingSuggestions || suggestions.length > 0) && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-gray-500 font-mono">
                    {loadingSuggestions ? "Generating intent variants..." : "AI-suggested search intents — click to include"}
                  </span>
                </div>
                {loadingSuggestions ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-gray-600" />
                    <span className="text-xs text-gray-600">Analyzing with You.com...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleSuggestion(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedSuggestions.has(s)
                            ? "bg-[#E74C3C]/20 border border-[#E74C3C]/50 text-[#E74C3C]"
                            : "bg-[#1a1a1a] border border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {selectedSuggestions.size > 0 && (
                  <p className="text-xs text-green-400/60 mt-2 font-mono">
                    {selectedSuggestions.size} intent{selectedSuggestions.size > 1 ? "s" : ""} selected — will be included in analysis
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Advanced Config Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced Configuration
          </button>

          {/* Advanced Panel */}
          {showAdvanced && (
            <div className="space-y-6 pt-4 border-t border-white/5">
              {/* Depth */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Analysis Depth
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["quick", "standard", "deep"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDepth(d)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        depth === d
                          ? "border-[#E74C3C] bg-[#E74C3C]/10 text-white"
                          : "border-white/10 text-gray-500 hover:border-white/20"
                      }`}
                    >
                      <div className="font-medium text-sm">{depthInfo[d].label}</div>
                      <div className="text-xs mt-1 opacity-60">
                        {depthInfo[d].pages} pages • {depthInfo[d].time}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Types */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Source Types
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => toggleSourceType("web")}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      sourceTypes.includes("web")
                        ? "border-[#E74C3C] bg-[#E74C3C]/10 text-white"
                        : "border-white/10 text-gray-500 hover:border-white/20"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-medium">Web</span>
                  </button>
                  <button
                    onClick={() => toggleSourceType("news")}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      sourceTypes.includes("news")
                        ? "border-[#E74C3C] bg-[#E74C3C]/10 text-white"
                        : "border-white/10 text-gray-500 hover:border-white/20"
                    }`}
                  >
                    <Newspaper className="w-4 h-4" />
                    <span className="text-sm font-medium">News</span>
                  </button>
                </div>
              </div>

              {/* Output Format */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Output Format
                </label>
                <div className="flex gap-3">
                  {(["pdf", "json", "both"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setOutputFormat(fmt)}
                      className={`flex-1 p-3 rounded-lg border transition-all text-sm font-medium ${
                        outputFormat === fmt
                          ? "border-[#E74C3C] bg-[#E74C3C]/10 text-white"
                          : "border-white/10 text-gray-500 hover:border-white/20"
                      }`}
                    >
                      {fmt === "pdf" ? "PDF Brief" : fmt === "json" ? "JSON Export" : "Both"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Geographic Region
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#E74C3C]/50"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Competitors */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Competitor Domains (Optional — up to 3)
                </label>
                <div className="space-y-2">
                  {competitors.map((comp, i) => (
                    <input
                      key={i}
                      type="text"
                      value={comp}
                      onChange={(e) => {
                        const updated = [...competitors];
                        updated[i] = e.target.value;
                        setCompetitors(updated);
                      }}
                      placeholder={`Competitor ${i + 1} (e.g. ${["competitor.com", "rival.io", "alternative.co"][i]})`}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-white/20"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Leave empty to auto-detect top competitors from You.com search results
                </p>
              </div>

              {/* Brand Voice Samples */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Brand Voice Samples (Optional)
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  Paste excerpts from your existing content so generated assets match your brand tone.
                </p>
                <div className="space-y-2">
                  {brandVoiceSamples.map((sample, i) => (
                    <textarea
                      key={i}
                      value={sample}
                      onChange={(e) => {
                        const updated = [...brandVoiceSamples];
                        updated[i] = e.target.value;
                        setBrandVoiceSamples(updated);
                      }}
                      placeholder={`Sample ${i + 1}: Paste a paragraph from your website that represents your brand voice...`}
                      rows={3}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-white/20 resize-y"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-4 rounded-lg text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all ${
              canSubmit
                ? "bg-[#E74C3C] text-white hover:bg-[#c0392b] hover:translate-y-[-1px] shadow-lg shadow-red-900/20"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Analysis...
              </>
            ) : (
              <>
                Analyze Citations <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-xs text-gray-600 text-center">
            Analysis takes {depthInfo[depth].time}. Scoutlytics reads publicly available web
            data only.
          </p>
        </div>
      </main>
    </div>
  );
}
