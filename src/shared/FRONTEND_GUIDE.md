// ============================================================================
// MODQUEUE HUB - FRONTEND INTEGRATION GUIDE
// ============================================================================

// ============================================================================
// SHARED TYPES (src/shared/types.ts)
// ============================================================================

// Import all types from:
import type {
  ModQueueItem,
  EnrichedModQueueItem,
  UserContext,
  PriorityScore,
  PriorityFactors,
  DetectedPattern,
  PatternType,
  PatternSeverity,
  ModPresence,
  ItemClaim,
  DailyStats,
  RecentActivity,
  ModAction,
} from '../shared/types';

// Key type structures:
// EnrichedModQueueItem = ModQueueItem + { priority: PriorityScore, context?: UserContext, claim?: ItemClaim, patterns?: DetectedPattern[] }
// ItemClaim = { itemId, claimedBy, claimedAt, expiresAt }
// PriorityScore = { itemId, score (0-5), reasoning, timestamp, factors }

// ============================================================================
// SHARED API TYPES (src/shared/api.ts)
// ============================================================================

import type {
  QueueResponse,
  ContextResponse,
  ClaimResponse,
  PresenceResponse,
} from '../shared/api';

// API Response structures:
// QueueResponse = { type: 'queue', items: EnrichedModQueueItem[], patterns: DetectedPattern[], activeModerators: ModPresence[], totalCount: number }
// ClaimResponse = { type: 'claim', success: boolean, claim?: ItemClaim, message?: string, existingClaim?: ItemClaim }
// PresenceResponse = { type: 'presence', moderators: ModPresence[] }
// ContextResponse = { type: 'context', userId: string, context: UserContext }

// ============================================================================
// API ENDPOINTS (src/server/routes/queue.ts)
// ============================================================================

// Base URL: /modqueue

// GET /modqueue/queue
// - Fetches enriched modqueue
// - Returns: QueueResponse
// - Use for: Initial load and refresh

// POST /modqueue/claim
// - Body: { itemId: string }
// - Returns: ClaimResponse
// - Use for: Claiming an item to work on

// DELETE /modqueue/claim
// - Body: { itemId: string }
// - Returns: { type: 'claim', success: boolean, message: string }
// - Use for: Releasing a claimed item

// GET /modqueue/claim/:itemId
// - Returns: { type: 'claim', claimed: boolean, claim: ItemClaim | null }
// - Use for: Checking if item is claimed

// GET /modqueue/presence
// - Returns: PresenceResponse
// - Use for: Getting active moderators

// GET /modqueue/context/:userId?username=xxx
// - Returns: ContextResponse
// - Use for: Getting detailed user info

// POST /modqueue/processed
// - Body: { priority?: number }
// - Returns: { status: 'success' }
// - Use for: Recording item as processed

// GET /modqueue/stats
// - Returns: { type: 'stats', stats: DailyStats | null }
// - Use for: Getting daily statistics

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
import { queueApi } from '../shared/api';

async function loadQueue() {
  const response = await fetch('/modqueue/queue');
  const data = await response.json();
  
  if (data.type === 'queue') {
    console.log('Items:', data.items);
    console.log('Patterns:', data.patterns);
    console.log('Active Mods:', data.activeModerators);
  }
}

async function claimItem(itemId: string) {
  const response = await fetch('/modqueue/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId }),
  });
  const data = await response.json();
  
  if (data.success) {
    console.log('Claimed:', data.claim);
  } else {
    console.log('Already claimed by:', data.existingClaim?.claimedBy);
  }
}
*/