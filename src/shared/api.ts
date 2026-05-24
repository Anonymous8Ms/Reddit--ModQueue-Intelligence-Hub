// ============================================================================
// API RESPONSE TYPES - Shared between frontend and backend
// ============================================================================

import type {
  DetectedPattern,
  EnrichedModQueueItem,
  ItemClaim,
  ModPresence,
  UserContext,
} from './types';

// ============================================================================
// MODQUEUE HUB API TYPES
// ============================================================================

export type QueueResponse = {
  type: 'queue';
  items: EnrichedModQueueItem[];
  patterns: DetectedPattern[];
  activeModerators: ModPresence[];
  totalCount: number;
  currentModeratorUsername: string | null;
};

export type ContextResponse = {
  type: 'context';
  userId: string;
  context: UserContext;
};

export type ClaimResponse = {
  type: 'claim';
  success: boolean;
  claim?: ItemClaim;
  message?: string;
  existingClaim?: ItemClaim;
};

export type PresenceResponse = {
  type: 'presence';
  moderators: ModPresence[];
};

// Re-export shared types for convenience
export type {
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
} from './types';
