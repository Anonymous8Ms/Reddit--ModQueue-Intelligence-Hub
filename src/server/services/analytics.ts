// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

import { getStats, incrementStats, incrementModAction, getAllClaims } from './redis';
import type { DailyStats } from '../../shared/types';

export async function recordItemProcessed(subreddit: string): Promise<void> {
  await incrementStats(subreddit, 'itemsProcessed');
}

export async function recordHighPriorityItem(subreddit: string): Promise<void> {
  await incrementStats(subreddit, 'highPriorityCount');
}

export async function recordModAction(subreddit: string, modUsername: string): Promise<void> {
  await incrementModAction(subreddit, modUsername);
}

export async function getDailyStats(subreddit: string, date?: string): Promise<DailyStats | null> {
  return await getStats(subreddit, date);
}

export async function getStatsSummary(subreddit: string): Promise<{
  today: DailyStats | null;
  collisionRate: number;
  processedToday: number;
}> {
  const today = await getStats(subreddit);
  const claims = await getAllClaims();
  
  // Calculate collision rate (claims that had existing claims / total claims)
  const collisionCount = claims.filter((_, i) => i > 0).length;
  const collisionRate = claims.length > 0 ? collisionCount / claims.length : 0;

  return {
    today,
    collisionRate: Math.round(collisionRate * 100),
    processedToday: today?.itemsProcessed ?? 0,
  };
}