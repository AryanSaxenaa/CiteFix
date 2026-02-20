import { AnalysisJob } from "./types";

const jobs = new Map<string, AnalysisJob>();

export function createJob(job: AnalysisJob): void {
  jobs.set(job.jobId, job);
}

export function getJob(jobId: string): AnalysisJob | undefined {
  return jobs.get(jobId);
}

export function updateJob(jobId: string, updates: Partial<AnalysisJob>): AnalysisJob | undefined {
  const job = jobs.get(jobId);
  if (!job) return undefined;
  const updated = { ...job, ...updates };
  jobs.set(jobId, updated);
  return updated;
}

export function getAllJobs(): AnalysisJob[] {
  return Array.from(jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function generateJobId(): string {
  return `cf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
