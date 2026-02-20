"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Globe,
  TrendingUp,
  Clock,
  BarChart3,
  AlertCircle,
  Loader2,
  Check,
  FileText,
  RefreshCw,
  Search,
  ChevronDown,
} from "lucide-react";

interface JobSummary {
  jobId: string;
  domain: string;
  topic: string;
  status: "pending" | "running" | "complete" | "failed";
  stage: number;
  stageLabel: string;
  createdAt: number;
  completedAt?: number;
  score: number | null;
  projectedScore: number | null;
  gapCount: number;
  citedUrlCount: number;
  userDomainFound: boolean;
  depth: string;
  country: string;
  hasPdf: boolean;
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze/history");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !filter ||
      job.domain.toLowerCase().includes(filter.toLowerCase()) ||
      job.topic.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group jobs by domain for trend tracking  
  const domainGroups: Record<string, JobSummary[]> = {};
  for (const job of filteredJobs) {
    const key = job.domain;
    if (!domainGroups[key]) domainGroups[key] = [];
    domainGroups[key].push(job);
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
  };

  const scoreColor = (score: number | null) => {
    if (score === null) return "text-gray-600";
    if (score < 40) return "text-red-400";
    if (score < 70) return "text-yellow-400";
    return "text-green-400";
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-mono">
            <Check className="w-2.5 h-2.5" /> Complete
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-mono">
            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Running
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-mono">
            <AlertCircle className="w-2.5 h-2.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 text-[10px] font-mono">
            <Clock className="w-2.5 h-2.5" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="relative min-h-screen text-white font-sans bg-bg-dark">
      <div className="fixed inset-0 bg-grid pointer-events-none z-0"></div>

      {/* Nav */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-full pl-6 pr-2 py-2 flex items-center gap-8 shadow-2xl shadow-black/50">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Scoutlytics" className="w-[90px] h-[90px] object-contain" />
            <span className="font-serif font-bold text-lg tracking-tight">Scoutlytics</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/analyze" className="text-xs text-gray-400 hover:text-white transition-colors">
              New Analysis
            </Link>
            <span className="text-xs text-white font-medium border-b border-[#E74C3C] pb-0.5">
              Dashboard
            </span>
          </div>
          <Link
            href="/analyze"
            className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1.5"
          >
            <ArrowRight className="w-3 h-3" /> New
          </Link>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif mb-2">Analysis Dashboard</h1>
            <p className="text-gray-500 text-sm">
              Track your analyses, compare scores, and monitor citation progress over time.
            </p>
          </div>
          <button
            onClick={fetchJobs}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors bg-white/5 border border-white/10 px-3 py-2 rounded-lg"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {/* Stats Row */}
        {jobs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-mono font-bold text-white">{jobs.length}</div>
              <div className="text-[10px] text-gray-500 uppercase mt-1">Total Analyses</div>
            </div>
            <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-mono font-bold text-green-400">
                {jobs.filter((j) => j.status === "complete").length}
              </div>
              <div className="text-[10px] text-gray-500 uppercase mt-1">Completed</div>
            </div>
            <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-mono font-bold text-white">
                {Object.keys(domainGroups).length}
              </div>
              <div className="text-[10px] text-gray-500 uppercase mt-1">Unique Domains</div>
            </div>
            <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-4 text-center">
              <div className={`text-2xl font-mono font-bold ${scoreColor(
                jobs.filter(j => j.score !== null).length > 0
                  ? Math.round(jobs.filter(j => j.score !== null).reduce((s, j) => s + (j.score || 0), 0) / jobs.filter(j => j.score !== null).length)
                  : null
              )}`}>
                {jobs.filter(j => j.score !== null).length > 0
                  ? Math.round(jobs.filter(j => j.score !== null).reduce((s, j) => s + (j.score || 0), 0) / jobs.filter(j => j.score !== null).length)
                  : "—"}
              </div>
              <div className="text-[10px] text-gray-500 uppercase mt-1">Avg Score</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search domains or topics..."
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#E74C3C]/50"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0F0F0F] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#E74C3C]/50 appearance-none pr-8"
            >
              <option value="all">All Status</option>
              <option value="complete">Complete</option>
              <option value="running">Running</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#E74C3C] animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && (
          <div className="text-center py-20">
            <BarChart3 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-gray-400 mb-2">No analyses yet</h2>
            <p className="text-gray-600 text-sm mb-6">
              Run your first analysis to start tracking citation performance.
            </p>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 bg-[#E74C3C] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#c0392b] transition-colors"
            >
              Run Analysis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Score Trend Chart (for domains with multiple runs) */}
        {Object.entries(domainGroups)
          .filter(([, runs]) => runs.filter((r) => r.score !== null).length >= 2)
          .map(([domain, runs]) => {
            const scored = runs.filter((r) => r.score !== null).sort((a, b) => a.createdAt - b.createdAt);
            const first = scored[0]?.score ?? 0;
            const last = scored[scored.length - 1]?.score ?? 0;
            const trend = last - first;

            return (
              <div key={domain} className="mb-8 bg-[#0F0F0F] border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-[#E74C3C]" />
                    <span className="text-sm font-medium text-white font-mono">{domain.replace(/^https?:\/\//, "")}</span>
                    <span className="text-xs text-gray-600">{scored.length} runs</span>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-mono ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
                    <TrendingUp className="w-4 h-4" />
                    {trend >= 0 ? "+" : ""}{trend} pts
                  </div>
                </div>
                {/* Simple score trend visualization */}
                <div className="flex items-end gap-1 h-16">
                  {scored.map((run, i) => {
                    const height = Math.max(8, ((run.score || 0) / 100) * 64);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-gray-500 font-mono">{run.score}</span>
                        <div
                          className={`w-full rounded-t ${
                            (run.score || 0) >= 70
                              ? "bg-green-500/40"
                              : (run.score || 0) >= 40
                              ? "bg-yellow-500/40"
                              : "bg-red-500/40"
                          }`}
                          style={{ height: `${height}px` }}
                        />
                        <span className="text-[8px] text-gray-700">{formatDate(run.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        {/* Job List */}
        {!loading && filteredJobs.length > 0 && (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              let hostname = "";
              try { hostname = new URL(job.domain).hostname.replace("www.", ""); } catch { hostname = job.domain; }

              return (
                <Link
                  key={job.jobId}
                  href={job.status === "complete" ? `/analyze/${job.jobId}/results` : job.status === "running" ? `/analyze/${job.jobId}/loading` : "#"}
                  className="block bg-[#0F0F0F] border border-white/10 rounded-xl p-4 hover:border-[#E74C3C]/30 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                        alt=""
                        width={24}
                        height={24}
                        className="rounded shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{hostname}</span>
                          {statusBadge(job.status)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {job.topic}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                      {job.score !== null && (
                        <div className="text-center">
                          <div className={`text-lg font-mono font-bold ${scoreColor(job.score)}`}>
                            {job.score}
                          </div>
                          <div className="text-[9px] text-gray-600 uppercase">Score</div>
                        </div>
                      )}
                      {job.projectedScore !== null && job.score !== null && (
                        <div className="text-center">
                          <div className="text-sm font-mono text-green-400">
                            +{job.projectedScore - job.score}
                          </div>
                          <div className="text-[9px] text-gray-600 uppercase">Potential</div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-sm font-mono text-gray-400">{job.gapCount}</div>
                        <div className="text-[9px] text-gray-600 uppercase">Gaps</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.hasPdf && (
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <div className="text-xs text-gray-600">
                          {formatDate(job.createdAt)}
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-[#E74C3C] transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* Re-run button for completed analyses */}
                  {job.status === "complete" && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[10px] text-gray-600">
                        <span>{job.citedUrlCount} URLs cited</span>
                        <span>·</span>
                        <span>{job.userDomainFound ? "Domain found in results" : "Domain not cited"}</span>
                        <span>·</span>
                        <span>{job.depth} · {job.country}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const params = new URLSearchParams({ domain: job.domain, topic: job.topic });
                          window.location.href = `/analyze?rerun=true&${params.toString()}`;
                        }}
                        className="flex items-center gap-1.5 text-[10px] text-[#E74C3C] hover:text-red-300 transition-colors bg-[#E74C3C]/5 hover:bg-[#E74C3C]/10 px-3 py-1.5 rounded-lg border border-[#E74C3C]/20"
                      >
                        <RefreshCw className="w-3 h-3" /> Re-run
                      </button>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* No results for filter */}
        {!loading && jobs.length > 0 && filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No analyses match your filter.</p>
          </div>
        )}
      </main>
    </div>
  );
}
