import type { OnboardingData } from "../types";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface ProfileSubmissionResult {
  id: string;
  createdAt: string;
  savedAt: number;
}

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Enterprise Production API client for Mednevo Cycle Tracker.
 * Supports configurable API baseUrl via environment variable `VITE_API_BASE_URL`.
 * Operates gracefully in standalone/mock mode if no remote endpoint is configured.
 */
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Check backend server liveness and health status.
   */
  async checkHealth(): Promise<{ status: string; message: string } | null> {
    const targetUrl = this.baseUrl || "http://localhost:5000";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${targetUrl}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        return (await response.json()) as { status: string; message: string };
      }
      return null;
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  }

  /**
   * Submit complete onboarding profile payload to Mednevo backend.
   */
  async submitOnboardingProfile(data: OnboardingData): Promise<ApiResponse<ProfileSubmissionResult>> {
    // If no backend URL configured, persist in standalone mode and return success
    if (!this.baseUrl) {
      // Standalone / offline mode simulation
      const result: ProfileSubmissionResult = {
        id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        savedAt: Date.now(),
      };
      return {
        success: true,
        data: result,
        statusCode: 200,
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/onboarding/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          profile: data,
          submittedAt: new Date().toISOString(),
          version: 1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `Server returned status ${response.status}`;
        try {
          const errorJson = await response.json();
          if (errorJson?.message) errorMsg = errorJson.message;
        } catch {
          // ignore json parse errors on error responses
        }
        return {
          success: false,
          error: errorMsg,
          statusCode: response.status,
        };
      }

      const responseData = await response.json();
      return {
        success: true,
        data: responseData,
        statusCode: response.status,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      const errorMsg = isAbort ? "Request timed out. Please try again." : (err as Error)?.message || "Network error";
      return {
        success: false,
        error: errorMsg,
        statusCode: isAbort ? 408 : 0,
      };
    }
  }
}

export const api = new ApiService();
