// ============================================================================
// MODQUEUE INTELLIGENCE HUB - SHARED TYPES
// ============================================================================

// Base item types from Reddit
export type ModQueueItem = {
  id: string;
  kind: 't3' | 't1'; // t3 = post, t1 = comment
  author: {
    id: string;
    name: string;
  };
  title?: string;
  body: string;
  permalink: string;
  numReports: number;
  userReports: [string, number][];
  modReports: [string, string, number][];
  createdUtc: number;
  subreddit: {
    name: string;
  };
};

export type RecentActivity = {
  type: 'post' | 'comment';
  id: string;
  subreddit: string;
  content: string;
  score: number;
  createdAt: number;
};

export type ModAction = {
  action: 'remove' | 'approve' | 'ban' | 'warn' | 'mute';
  modUsername: string;
  timestamp: number;
  details: string;
};

// ============================================================================
// USER CONTEXT (for Context Enrichment)
// ============================================================================

export type UserContext = {
  userId: string;
  username: string;
  karma: {
    post: number;
    comment: number;
    total: number;
  };
  accountAgeDays: number;
  createdAt: number;
  recentActivity: RecentActivity[];
  modActions: ModAction[];
  subredditParticipation: {
    postCount: number;
    commentCount: number;
    firstSeen: number;
  };
};

// ============================================================================
// PRIORITY SCORING
// ============================================================================

export type PriorityFactors = {
  reportCount: number;
  userKarma: number;
  accountAgeDays: number;
  contentType: 'post' | 'comment';
  hasKeywords: boolean;
  previousViolations: number;
};

export type PriorityScore = {
  itemId: string;
  score: number; // 1-5 (higher = more urgent)
  reasoning: string;
  timestamp: number;
  factors: PriorityFactors;
};

export type EnrichedModQueueItem = ModQueueItem & {
  priority: PriorityScore;
  context?: UserContext;
  claim?: ItemClaim;
  patterns?: DetectedPattern[];
};

// ============================================================================
// MOD PRESENCE & COLLISION PREVENTION
// ============================================================================

export type ModPresence = {
  username: string;
  lastSeen: number;
  currentSubreddit: string;
};

export type ItemClaim = {
  itemId: string;
  claimedBy: string;
  claimedAt: number;
  expiresAt: number;
};

// ============================================================================
// PATTERN DETECTION
// ============================================================================

export type PatternType = 'spam_wave' | 'brigade' | 'bot_activity';

export type PatternSeverity = 'low' | 'medium' | 'high' | 'critical';

export type DetectedPattern = {
  type: PatternType;
  severity: PatternSeverity;
  description: string;
  affectedItems: string[];
  detectedAt: number;
  confidence: number;
};

// ============================================================================
// DAILY ANALYTICS
// ============================================================================

export type DailyStats = {
  subreddit: string;
  date: string;
  itemsProcessed: number;
  averageProcessingTime: number;
  collisionsAvoided: number;
  highPriorityCount: number;
  topModerator: string;
  moderatorActions: Record<string, number>;
};
