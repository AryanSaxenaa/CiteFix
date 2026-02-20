import { AnalysisJob } from "./types";
import { supabase } from "./supabase";

// In-memory cache for fast mid-pipeline reads (avoids round-trip latency during stages)
const memoryCache = new Map<string, AnalysisJob>();

// Helper: convert AnalysisJob → Supabase row
function toRow(job: AnalysisJob) {
  return {
    job_id: job.jobId,
    domain: job.domain,
    topic: job.topic,
    intent_variants: job.intentVariants,
    config: job.config,
    status: job.status,
    stage: job.stage,
    stage_label: job.stageLabel,
    created_at: job.createdAt,
    completed_at: job.completedAt ?? null,
    user_email: job.userEmail ?? null,
    error: job.error ?? null,
    discovery_results: job.discoveryResults ?? null,
    extraction_results: job.extractionResults ?? null,
    domain_analysis: job.domainAnalysis ?? null,
    pattern_results: job.patternResults ?? null,
    generated_assets: job.generatedAssets ?? null,
    advanced_research: job.advancedResearch ?? null,
    api_tracking: job.apiTracking ?? null,
    pdf_url: job.pdfUrl ?? null,
  };
}

// Helper: convert Supabase row → AnalysisJob
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(row: any): AnalysisJob {
  return {
    jobId: row.job_id,
    domain: row.domain,
    topic: row.topic,
    intentVariants: row.intent_variants || [],
    config: row.config || { depth: "standard", sourceTypes: ["web"], outputFormat: "both", competitors: [], country: "US" },
    status: row.status,
    stage: row.stage,
    stageLabel: row.stage_label,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    userEmail: row.user_email ?? undefined,
    error: row.error ?? undefined,
    discoveryResults: row.discovery_results ?? undefined,
    extractionResults: row.extraction_results ?? undefined,
    domainAnalysis: row.domain_analysis ?? undefined,
    patternResults: row.pattern_results ?? undefined,
    generatedAssets: row.generated_assets ?? undefined,
    advancedResearch: row.advanced_research ?? undefined,
    apiTracking: row.api_tracking ?? undefined,
    pdfUrl: row.pdf_url ?? undefined,
  };
}

export async function createJob(job: AnalysisJob): Promise<void> {
  memoryCache.set(job.jobId, job);

  try {
    await supabase.from("analysis_jobs").insert(toRow(job));
  } catch (err) {
    console.error("[store] Supabase insert failed, using memory only:", err);
  }
}

export async function getJob(jobId: string): Promise<AnalysisJob | undefined> {
  // Check memory cache first (fast path for active pipelines)
  const cached = memoryCache.get(jobId);
  if (cached) return cached;

  // Fall back to Supabase
  try {
    const { data, error } = await supabase
      .from("analysis_jobs")
      .select("*")
      .eq("job_id", jobId)
      .single();

    if (error || !data) return undefined;
    const job = fromRow(data);
    memoryCache.set(jobId, job); // warm cache
    return job;
  } catch {
    return undefined;
  }
}

export async function updateJob(
  jobId: string,
  updates: Partial<AnalysisJob>
): Promise<AnalysisJob | undefined> {
  // Update memory cache
  const job = memoryCache.get(jobId);
  if (!job) {
    // Try loading from Supabase first
    const remote = await getJob(jobId);
    if (!remote) return undefined;
    const updated = { ...remote, ...updates };
    memoryCache.set(jobId, updated);
    persistUpdate(jobId, updated);
    return updated;
  }

  const updated = { ...job, ...updates };
  memoryCache.set(jobId, updated);

  // Async persist to Supabase (don't block pipeline)
  persistUpdate(jobId, updated);

  return updated;
}

function persistUpdate(jobId: string, job: AnalysisJob): void {
  const row = toRow(job);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { job_id, ...updateFields } = row;

  supabase
    .from("analysis_jobs")
    .update(updateFields)
    .eq("job_id", jobId)
    .then(({ error }) => {
      if (error) console.error("[store] Supabase update failed:", error.message);
    });
}

export async function getAllJobs(): Promise<AnalysisJob[]> {
  try {
    const { data, error } = await supabase
      .from("analysis_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      // Fallback to memory
      return Array.from(memoryCache.values()).sort((a, b) => b.createdAt - a.createdAt);
    }

    return data.map(fromRow);
  } catch {
    return Array.from(memoryCache.values()).sort((a, b) => b.createdAt - a.createdAt);
  }
}

export async function getJobsByDomain(domain: string): Promise<AnalysisJob[]> {
  try {
    const { data, error } = await supabase
      .from("analysis_jobs")
      .select("*")
      .eq("domain", domain)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(fromRow);
  } catch {
    return [];
  }
}

export function generateJobId(): string {
  return `cf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
