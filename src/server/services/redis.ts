// ============================================================================
// REDIS UTILITIES - All Redis operations for ModQueue Hub
// ============================================================================

import { redis } from '@devvit/web/server';
import type {
  ModPresence,
  ItemClaim,
  PriorityScore,
  UserContext,
  DetectedPattern,
  DailyStats,
} from '../../shared/types';

// TTL values in seconds
const TTL = {
  PRESENCE: 60,
  CLAIM: 300,
  PRIORITY: 120,
  USER_CONTEXT: 600,
  PATTERN: 3600,
};

const INDEX = {
  PRESENCE: 'index:presence',
  CLAIM: 'index:claim',
  PRIORITY: 'index:priority',
  PATTERN: 'index:pattern',
};

// ============================================================================
// MOD PRESENCE TRACKING
// ============================================================================

export async function updateModPresence(
  username: string,
  subreddit: string
): Promise<void> {
  const key = `presence:${username}`;
  const presence: ModPresence = {
    username,
    lastSeen: Date.now(),
    currentSubreddit: subreddit,
  };
  await redis.set(key, JSON.stringify(presence), {
    expiration: new Date(Date.now() + TTL.PRESENCE * 1000),
  });
  await redis.hSet(INDEX.PRESENCE, { [username]: key });
}

export async function getModPresence(
  username: string
): Promise<ModPresence | null> {
  const data = await redis.get(`presence:${username}`);
  if (!data) return null;
  return JSON.parse(data) as ModPresence;
}

export async function getActiveModerators(): Promise<ModPresence[]> {
  const usernames = await redis.hKeys(INDEX.PRESENCE);
  const moderators: ModPresence[] = [];

  for (const username of usernames.slice(0, 50)) {
    const key = await redis.hGet(INDEX.PRESENCE, username);
    if (!key) continue;
    const data = await redis.get(key);
    if (data) {
      const presence = JSON.parse(data) as ModPresence;
      // Only include if seen in last 2 minutes
      if (Date.now() - presence.lastSeen < 120000) {
        moderators.push(presence);
      }
    } else {
      await redis.hDel(INDEX.PRESENCE, [username]);
    }
  }

  return moderators;
}

export async function removeModPresence(username: string): Promise<void> {
  await redis.del(`presence:${username}`);
  await redis.hDel(INDEX.PRESENCE, [username]);
}

// ============================================================================
// ITEM CLAIMS (Collision Prevention)
// ============================================================================

export async function claimItem(
  itemId: string,
  modUsername: string
): Promise<ItemClaim | null> {
  const key = `claim:${itemId}`;

  // Check if already claimed
  const existing = await redis.get(key);
  if (existing) {
    const claim = JSON.parse(existing) as ItemClaim;
    // If claimed by same mod, extend the claim
    if (claim.claimedBy === modUsername) {
      claim.expiresAt = Date.now() + TTL.CLAIM * 1000;
      await redis.set(key, JSON.stringify(claim), {
        expiration: new Date(Date.now() + TTL.CLAIM * 1000),
      });
      return claim;
    }
    // Already claimed by someone else
    return null;
  }

  // Create new claim
  const claim: ItemClaim = {
    itemId,
    claimedBy: modUsername,
    claimedAt: Date.now(),
    expiresAt: Date.now() + TTL.CLAIM * 1000,
  };

  await redis.set(key, JSON.stringify(claim), {
    expiration: new Date(Date.now() + TTL.CLAIM * 1000),
  });
  await redis.hSet(INDEX.CLAIM, { [itemId]: key });
  return claim;
}

export async function getItemClaim(
  itemId: string
): Promise<ItemClaim | null> {
  const data = await redis.get(`claim:${itemId}`);
  if (!data) return null;
  return JSON.parse(data) as ItemClaim;
}

export async function releaseItemClaim(
  itemId: string,
  modUsername: string
): Promise<boolean> {
  const claim = await getItemClaim(itemId);
  if (!claim || claim.claimedBy !== modUsername) {
    return false;
  }
  await redis.del(`claim:${itemId}`);
  await redis.hDel(INDEX.CLAIM, [itemId]);
  return true;
}

export async function getAllClaims(): Promise<ItemClaim[]> {
  const itemIds = await redis.hKeys(INDEX.CLAIM);
  const claims: ItemClaim[] = [];

  for (const itemId of itemIds) {
    const key = await redis.hGet(INDEX.CLAIM, itemId);
    if (!key) continue;
    const data = await redis.get(key);
    if (data) {
      claims.push(JSON.parse(data) as ItemClaim);
    } else {
      await redis.hDel(INDEX.CLAIM, [itemId]);
    }
  }

  return claims;
}

// ============================================================================
// PRIORITY SCORES CACHE
// ============================================================================

export async function setPriorityScore(
  itemId: string,
  score: PriorityScore
): Promise<void> {
  await redis.set(`priority:${itemId}`, JSON.stringify(score), {
    expiration: new Date(Date.now() + TTL.PRIORITY * 1000),
  });
  await redis.hSet(INDEX.PRIORITY, { [itemId]: `priority:${itemId}` });
}

export async function getPriorityScore(
  itemId: string
): Promise<PriorityScore | null> {
  const data = await redis.get(`priority:${itemId}`);
  if (!data) return null;
  return JSON.parse(data) as PriorityScore;
}

export async function getAllPriorityScores(): Promise<PriorityScore[]> {
  const itemIds = await redis.hKeys(INDEX.PRIORITY);
  const scores: PriorityScore[] = [];

  for (const itemId of itemIds) {
    const key = await redis.hGet(INDEX.PRIORITY, itemId);
    if (!key) continue;
    const data = await redis.get(key);
    if (data) {
      scores.push(JSON.parse(data) as PriorityScore);
    } else {
      await redis.hDel(INDEX.PRIORITY, [itemId]);
    }
  }

  return scores;
}

// ============================================================================
// USER CONTEXT CACHE
// ============================================================================

export async function setUserContext(
  userId: string,
  context: UserContext
): Promise<void> {
  await redis.set(`context:${userId}`, JSON.stringify(context), {
    expiration: new Date(Date.now() + TTL.USER_CONTEXT * 1000),
  });
}

export async function getUserContext(
  userId: string
): Promise<UserContext | null> {
  const data = await redis.get(`context:${userId}`);
  if (!data) return null;
  return JSON.parse(data) as UserContext;
}

// ============================================================================
// PATTERN DETECTION CACHE
// ============================================================================

export async function setPattern(
  type: string,
  pattern: DetectedPattern
): Promise<void> {
  const today = getTodayKey();
  const key = `pattern:${type}:${today}`;
  await redis.set(key, JSON.stringify(pattern), {
    expiration: new Date(Date.now() + TTL.PATTERN * 1000),
  });
  await redis.hSet(INDEX.PATTERN, { [`${type}:${today}`]: key });
}

export async function getPatterns(
  type: string
): Promise<DetectedPattern | null> {
  const today = getTodayKey();
  const data = await redis.get(`pattern:${type}:${today}`);
  if (!data) return null;
  return JSON.parse(data) as DetectedPattern;
}

export async function getAllPatterns(): Promise<DetectedPattern[]> {
  const patternIds = await redis.hKeys(INDEX.PATTERN);
  const patterns: DetectedPattern[] = [];

  for (const patternId of patternIds) {
    const key = await redis.hGet(INDEX.PATTERN, patternId);
    if (!key) continue;
    const data = await redis.get(key);
    if (data) {
      const pattern = JSON.parse(data) as DetectedPattern;
      // Only include patterns from last hour
      if (Date.now() - pattern.detectedAt < 3600000) {
        patterns.push(pattern);
      }
    } else {
      await redis.hDel(INDEX.PATTERN, [patternId]);
    }
  }

  return patterns;
}

// ============================================================================
// DAILY ANALYTICS
// ============================================================================

export async function incrementStats(
  subreddit: string,
  field: keyof DailyStats
): Promise<void> {
  const today = getTodayKey();
  const key = `stats:${subreddit}:${today}`;

  const data = await redis.get(key);
  const stats: DailyStats = data
    ? JSON.parse(String(data))
    : createEmptyStats(subreddit, today);

  if (typeof stats[field] === 'number') {
    (stats[field] as number)++;
  }

  await redis.set(key, JSON.stringify(stats));
}

export async function incrementModAction(
  subreddit: string,
  modUsername: string
): Promise<void> {
  const today = getTodayKey();
  const key = `stats:${subreddit}:${today}`;

  const data = await redis.get(key);
  const stats: DailyStats = data
    ? JSON.parse(String(data))
    : createEmptyStats(subreddit, today);

  stats.moderatorActions[modUsername] =
    (stats.moderatorActions[modUsername] || 0) + 1;

  await redis.set(key, JSON.stringify(stats));
}

export async function getStats(
  subreddit: string,
  date?: string
): Promise<DailyStats | null> {
  const targetDate = date || getTodayKey();
  const data = await redis.get(`stats:${subreddit}:${targetDate}`);
  if (!data) return null;
  return JSON.parse(data) as DailyStats;
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0] ?? new Date().toISOString();
}

function createEmptyStats(subreddit: string, date: string): DailyStats {
  return {
    subreddit,
    date,
    itemsProcessed: 0,
    averageProcessingTime: 0,
    collisionsAvoided: 0,
    highPriorityCount: 0,
    topModerator: '',
    moderatorActions: {},
  };
}
