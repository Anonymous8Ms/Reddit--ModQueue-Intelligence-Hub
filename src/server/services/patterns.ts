// ============================================================================
// PATTERN DETECTION - Rule-based pattern detection (No ML needed)
// ============================================================================

import type { DetectedPattern, EnrichedModQueueItem, PatternSeverity } from '../../shared/types';

// ============================================================================
// PATTERN 1: SPAM WAVE
// Check: 5+ items from accounts < 30 days old in last 10 minutes
// ============================================================================

function detectSpamWave(items: EnrichedModQueueItem[], now: number): DetectedPattern | null {
  const last10Minutes = now - 10 * 60 * 1000;
  const recentNewAccountItems = items.filter((item) => {
    const isRecent = item.createdUtc * 1000 > last10Minutes;
    const isNewAccount = (item.context?.accountAgeDays ?? 999) < 30;
    return isRecent && isNewAccount;
  });

  if (recentNewAccountItems.length >= 5) {
    return {
      type: 'spam_wave',
      severity: (recentNewAccountItems.length >= 10 ? 'critical' : 'high') as PatternSeverity,
      description: `${recentNewAccountItems.length} posts from new accounts in 10 minutes`,
      affectedItems: recentNewAccountItems.map((i) => i.id),
      detectedAt: now,
      confidence: 0.85,
    };
  }
  return null;
}

// ============================================================================
// PATTERN 2: BRIGADE
// Check: 3+ items with 5+ reports each in last 10 minutes
// ============================================================================

function detectBrigade(items: EnrichedModQueueItem[], now: number): DetectedPattern | null {
  const last10Minutes = now - 10 * 60 * 1000;
  const heavilyReportedItems = items.filter((item) => {
    const isRecent = item.createdUtc * 1000 > last10Minutes;
    const isHeavilyReported = item.numReports >= 5;
    return isRecent && isHeavilyReported;
  });

  if (heavilyReportedItems.length >= 3) {
    return {
      type: 'brigade',
      severity: 'high',
      description: `${heavilyReportedItems.length} items with 5+ reports in 10 minutes`,
      affectedItems: heavilyReportedItems.map((i) => i.id),
      detectedAt: now,
      confidence: 0.75,
    };
  }
  return null;
}

// ============================================================================
// PATTERN 3: BOT ACTIVITY
// Check: Same user posting 3+ times in 5 minutes
// ============================================================================

function detectBotActivity(items: EnrichedModQueueItem[], now: number): DetectedPattern | null {
  const last5Minutes = now - 5 * 60 * 1000;
  const userPostCounts = new Map<string, string[]>();

  items.forEach((item) => {
    if (item.createdUtc * 1000 > last5Minutes) {
      const authorId = item.author.id;
      if (!userPostCounts.has(authorId)) {
        userPostCounts.set(authorId, []);
      }
      userPostCounts.get(authorId)!.push(item.id);
    }
  });

  for (const [userId, itemIds] of userPostCounts) {
    if (itemIds.length >= 3) {
      return {
        type: 'bot_activity',
        severity: 'medium',
        description: `User posting ${itemIds.length} times in 5 minutes`,
        affectedItems: itemIds,
        detectedAt: now,
        confidence: 0.70,
      };
    }
  }
  return null;
}

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

export function detectPatterns(items: EnrichedModQueueItem[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const now = Date.now();

  const spamWave = detectSpamWave(items, now);
  if (spamWave) patterns.push(spamWave);

  const brigade = detectBrigade(items, now);
  if (brigade) patterns.push(brigade);

  const botActivity = detectBotActivity(items, now);
  if (botActivity) patterns.push(botActivity);

  return patterns;
}

export function getPatternIcon(type: DetectedPattern['type']): string {
  switch (type) {
    case 'spam_wave': return '🚫';
    case 'brigade': return '⚠️';
    case 'bot_activity': return '🤖';
  }
}

export function getPatternSeverityColor(severity: PatternSeverity): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
  }
}