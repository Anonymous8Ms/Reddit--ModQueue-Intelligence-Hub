// ============================================================================
// MODQUEUE HUB - API CLIENT FOR FRONTEND
// ============================================================================

import type {
  QueueResponse,
  ClaimResponse,
  ContextResponse,
  PresenceResponse,
  DetectedPattern,
  ItemClaim,
} from '../shared/api';

// ============================================================================
// API CLIENT
// ============================================================================

export const api = {
  // Fetch enriched modqueue
  async getQueue(): Promise<QueueResponse> {
    return requestJson<QueueResponse>('/api/modqueue/queue');
  },

  // Claim an item
  async claimItem(itemId: string): Promise<ClaimResponse> {
    return requestJson<ClaimResponse>('/api/modqueue/claim', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  },

  // Release an item
  async releaseItem(itemId: string): Promise<ClaimResponse> {
    return requestJson<ClaimResponse>('/api/modqueue/claim', {
      method: 'DELETE',
      body: JSON.stringify({ itemId }),
    });
  },

  // Check claim status
  async getClaimStatus(itemId: string): Promise<{ claimed: boolean; claim: ItemClaim | null }> {
    return requestJson<{ claimed: boolean; claim: ItemClaim | null }>(
      `/api/modqueue/claim/${itemId}`
    );
  },

  // Get active moderators
  async getPresence(): Promise<PresenceResponse> {
    return requestJson<PresenceResponse>('/api/modqueue/presence');
  },

  // Get user context
  async getUserContext(userId: string, username: string): Promise<ContextResponse> {
    return requestJson<ContextResponse>(
      `/api/modqueue/context/${userId}?username=${encodeURIComponent(username)}`
    );
  },

  // Record processed item
  async recordProcessed(priority?: number): Promise<void> {
    await requestJson('/api/modqueue/processed', {
      method: 'POST',
      body: JSON.stringify({ priority }),
    });
  },
};

async function requestJson<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  if (!text) {
    throw new Error(`Empty response from ${input}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from ${input}: ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

// ============================================================================
// PRIORITY HELPERS
// ============================================================================

export function getPriorityLevel(
  score: number
): 'minimal' | 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 1) return 'minimal';
  if (score <= 2) return 'low';
  if (score <= 3) return 'medium';
  if (score <= 4) return 'high';
  return 'critical';
}

export function getPriorityColor(score: number): string {
  const level = getPriorityLevel(score);
  switch (level) {
    case 'minimal': return '#64748b';
    case 'critical': return '#dc2626';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
  }
}

export function getPriorityLabel(score: number): string {
  const level = getPriorityLevel(score);
  return level.toUpperCase();
}

// ============================================================================
// PATTERN HELPERS
// ============================================================================

export function getPatternIcon(type: DetectedPattern['type']): string {
  switch (type) {
    case 'spam_wave': return '🚫';
    case 'brigade': return '⚠️';
    case 'bot_activity': return '🤖';
  }
}

export function getPatternColor(severity: DetectedPattern['severity']): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
  }
}

// ============================================================================
// TIME HELPERS
// ============================================================================

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatAccountAge(days: number): string {
  if (days < 1) return 'Today';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
}
