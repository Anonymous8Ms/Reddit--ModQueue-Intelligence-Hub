// ============================================================================
// MODQUEUE HUB - API CLIENT FOR FRONTEND
// ============================================================================

import type {
  EnrichedModQueueItem,
  QueueResponse,
  ClaimResponse,
  ContextResponse,
  PresenceResponse,
  DetectedPattern,
  UserContext,
  ModPresence,
  ItemClaim,
} from '../shared/types';

// ============================================================================
// API CLIENT
// ============================================================================

export const api = {
  // Fetch enriched modqueue
  async getQueue(): Promise<QueueResponse> {
    const res = await fetch('/modqueue/queue');
    return res.json();
  },

  // Claim an item
  async claimItem(itemId: string): Promise<ClaimResponse> {
    const res = await fetch('/modqueue/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    });
    return res.json();
  },

  // Release an item
  async releaseItem(itemId: string): Promise<ClaimResponse> {
    const res = await fetch('/modqueue/claim', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    });
    return res.json();
  },

  // Check claim status
  async getClaimStatus(itemId: string): Promise<{ claimed: boolean; claim: ItemClaim | null }> {
    const res = await fetch(`/modqueue/claim/${itemId}`);
    return res.json();
  },

  // Get active moderators
  async getPresence(): Promise<PresenceResponse> {
    const res = await fetch('/modqueue/presence');
    return res.json();
  },

  // Get user context
  async getUserContext(userId: string, username: string): Promise<ContextResponse> {
    const res = await fetch(`/modqueue/context/${userId}?username=${encodeURIComponent(username)}`);
    return res.json();
  },

  // Record processed item
  async recordProcessed(priority?: number): Promise<void> {
    await fetch('/modqueue/processed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    });
  },
};

// ============================================================================
// PRIORITY HELPERS
// ============================================================================

export function getPriorityLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 2) return 'low';
  if (score < 3) return 'medium';
  if (score < 4) return 'high';
  return 'critical';
}

export function getPriorityColor(score: number): string {
  const level = getPriorityLevel(score);
  switch (level) {
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