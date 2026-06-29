import {
  CommunicationVerifyResult,
  ContentAnalysisResult,
  DashboardStats,
  MediaAnalysisResult,
  UrlAnalysisResult,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? `Request to ${path} failed with status ${res.status}`);
  }
  return res.json();
}

export function analyzeUrl(url: string): Promise<UrlAnalysisResult> {
  return postJson("/api/analyze/url", { url });
}

export function analyzeContent(text: string): Promise<ContentAnalysisResult> {
  return postJson("/api/analyze/content", { text });
}

export async function analyzeMedia(file: File): Promise<MediaAnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/analyze/media`, { method: "POST", body: formData });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? `Media analysis failed with status ${res.status}`);
  }
  return res.json();
}

export function verifyCommunication(text: string): Promise<CommunicationVerifyResult> {
  return postJson("/api/verify/communication", { text });
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_URL}/api/dashboard/stats`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard stats: ${res.status}`);
  }
  return res.json();
}
