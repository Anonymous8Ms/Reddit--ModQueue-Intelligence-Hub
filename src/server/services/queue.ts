// ============================================================================
// QUEUE SERVICE - Main orchestration service
// ============================================================================

import type {
  EnrichedModQueueItem,
  UserContext,
  DetectedPattern,
  ModPresence,
  ItemClaim,
} from '../../shared/types';
import { fetchModQueue, getFullUserContext, getCurrentModerator } from './reddit';
import { getUserContext, setUserContext, getAllClaims, updateModPresence, getActiveModerators } from './redis';
import { calculatePriorityScoreWithContext } from './scoring';
import { detectPatterns } from './patterns';

export type QueueData = {
  items: EnrichedModQueueItem[];
  patterns: DetectedPattern[];
  activeModerators: ModPresence[];
  totalCount: number;
};

// ============================================================================
// FETCH ENRICHED QUEUE
// ============================================================================

export async function getEnrichedQueue(subredditName: string): Promise<QueueData> {
  // 1. Fetch raw modqueue items
  const rawItems = await fetchModQueue(subredditName);
  const activeModerators = await getActiveModerators();
  
  if (rawItems.length === 0) {
    return { items: [], patterns: [], activeModerators, totalCount: 0 };
  }

  // 2. Get current claims (for collision prevention)
  const claims = await getAllClaims();
  const claimMap = new Map<string, ItemClaim>();
  claims.forEach((c) => claimMap.set(c.itemId, c));

  // 3. Enrich items with priority and context
  const enrichedItems: EnrichedModQueueItem[] = [];

  for (const item of rawItems) {
    // Get or compute priority score
    let userContext: UserContext | undefined;
    const cacheKey = getContextCacheKey(item.author.id, item.author.name);

    // Check cache first
    const cachedContext = await getUserContext(cacheKey);
    if (cachedContext) {
      userContext = cachedContext;
    } else {
      // Fetch and cache
      const fetchedContext = await getFullUserContext(
        item.author.id,
        item.author.name,
        subredditName
      );
      if (fetchedContext) {
        await setUserContext(cacheKey, fetchedContext);
        userContext = fetchedContext;
      }
    }

    // Calculate priority with context
    const priority = userContext
      ? calculatePriorityScoreWithContext(item, {
          accountAgeDays: userContext.accountAgeDays,
          karma: userContext.karma.total,
          previousViolations: userContext.modActions.filter(
            (a) => a.action === 'remove' || a.action === 'ban'
          ).length,
        })
      : calculatePriorityScoreWithContext(item);

    enrichedItems.push({
      ...item,
      priority,
      context: userContext,
      claim: claimMap.get(item.id),
    });
  }

  // 4. Sort by priority (highest first)
  enrichedItems.sort((a, b) => b.priority.score - a.priority.score);

  // 5. Detect patterns
  const patterns = detectPatterns(enrichedItems);

  return {
    items: enrichedItems,
    patterns,
    activeModerators,
    totalCount: rawItems.length,
  };
}

// ============================================================================
// UPDATE MOD PRESENCE
// ============================================================================

export async function updateCurrentModPresence(subredditName: string): Promise<ModPresence | null> {
  const mod = await getCurrentModerator();
  if (!mod) return null;

  await updateModPresence(mod.username, subredditName);
  return {
    username: mod.username,
    lastSeen: Date.now(),
    currentSubreddit: subredditName,
  };
}

// ============================================================================
// GET USER CONTEXT FOR DETAIL VIEW
// ============================================================================

export async function getEnrichedUserContext(
  userId: string,
  username: string,
  subredditName: string
): Promise<UserContext | null> {
  const cacheKey = getContextCacheKey(userId, username);
  // Check cache first
  const cached = await getUserContext(cacheKey);
  if (cached) return cached;

  // Fetch fresh
  const context = await getFullUserContext(userId, username, subredditName);
  if (context) {
    await setUserContext(cacheKey, context);
  }
  return context;
}

function getContextCacheKey(userId: string, username: string): string {
  if (userId && userId !== 'unknown') {
    return userId;
  }

  return `username:${username.toLowerCase()}`;
}
