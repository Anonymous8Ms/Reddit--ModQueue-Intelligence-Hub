// ============================================================================
// API RESPONSE TYPES - Shared between frontend and backend
// ============================================================================

export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

// ============================================================================
// MODQUEUE HUB API TYPES
// ============================================================================

export type QueueResponse = {
  type: 'queue';
  items: EnrichedModQueueItem[];
  patterns: DetectedPattern[];
  activeModerators: ModPresence[];
  totalCount: number;
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