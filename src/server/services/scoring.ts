// ============================================================================
// PRIORITY SCORING ENGINE - Rule-based scoring for MVP
// ============================================================================

import type { PriorityScore, PriorityFactors, ModQueueItem } from '../../shared/types';

const WEIGHTS = {
  REPORTS: { BASE: 1, PER_REPORT: 0.3, MAX_REPORTS: 5 },
  KARMA: { VERY_LOW: 2, LOW: 1, MEDIUM: 0, HIGH: -1 },
  ACCOUNT_AGE: { NEW: 2, YOUNG: 1, ESTABLISHED: 0 },
  PREVIOUS_VIOLATIONS: { PER_VIOLATION: 0.5, MAX_VIOLATIONS: 3 },
  KEYWORDS: 1,
  CONTENT_TYPE: { POST: 0.5, COMMENT: 0 },
};

const SUSPICIOUS_KEYWORDS = [
  'free money', 'click here', 'limited time', 'act now', 'buy now',
  'discount code', 'crypto giveaway', 'airdrop', 'telegram', 'whatsapp',
  'DM me', 'DM for', 'nsfw link', 'bit.ly', 'tinyurl', 'goo.gl',
];

export function calculatePriorityScore(item: ModQueueItem): PriorityScore {
  const factors = extractFactors(item);
  const score = computeScore(factors);
  const reasoning = generateReasoning(factors, score);
  return { itemId: item.id, score, reasoning, timestamp: Date.now(), factors };
}

export function calculatePriorityScoreWithContext(
  item: ModQueueItem,
  userContext?: { accountAgeDays: number; karma: number; previousViolations: number }
): PriorityScore {
  const baseFactors = extractFactors(item);
  const factors: PriorityFactors = {
    ...baseFactors,
    userKarma: userContext?.karma ?? baseFactors.userKarma,
    accountAgeDays: userContext?.accountAgeDays ?? baseFactors.accountAgeDays,
    previousViolations: userContext?.previousViolations ?? baseFactors.previousViolations,
  };
  const score = computeScore(factors);
  const reasoning = generateReasoningWithContext(factors, score);
  return { itemId: item.id, score, reasoning, timestamp: Date.now(), factors };
}

function extractFactors(item: ModQueueItem): PriorityFactors {
  return {
    reportCount: Math.min(item.numReports, WEIGHTS.REPORTS.MAX_REPORTS),
    userKarma: 0, accountAgeDays: 0,
    contentType: item.kind === 't3' ? 'post' : 'comment',
    hasKeywords: checkForKeywords(item), previousViolations: 0,
  };
}

function checkForKeywords(item: ModQueueItem): boolean {
  const content = [item.title || '', item.body].join(' ').toLowerCase();
  return SUSPICIOUS_KEYWORDS.some((keyword) => content.includes(keyword));
}

function computeScore(factors: PriorityFactors): number {
  let score = 0;
  score += WEIGHTS.REPORTS.BASE;
  score += factors.reportCount * WEIGHTS.REPORTS.PER_REPORT;
  if (factors.userKarma < 10) score += WEIGHTS.KARMA.VERY_LOW;
  else if (factors.userKarma < 100) score += WEIGHTS.KARMA.LOW;
  else if (factors.userKarma >= 1000) score += WEIGHTS.KARMA.HIGH;
  if (factors.accountAgeDays < 7) score += WEIGHTS.ACCOUNT_AGE.NEW;
  else if (factors.accountAgeDays < 30) score += WEIGHTS.ACCOUNT_AGE.YOUNG;
  score += Math.min(factors.previousViolations, WEIGHTS.PREVIOUS_VIOLATIONS.MAX_VIOLATIONS) * WEIGHTS.PREVIOUS_VIOLATIONS.PER_VIOLATION;
  if (factors.hasKeywords) score += WEIGHTS.KEYWORDS;
  if (factors.contentType === 'post') score += WEIGHTS.CONTENT_TYPE.POST;
  return Math.min(score, 5);
}

function generateReasoning(factors: PriorityFactors, score: number): string {
  const reasons: string[] = [score < 2 ? 'LOW PRIORITY' : score < 3 ? 'MEDIUM PRIORITY' : score < 4 ? 'HIGH PRIORITY' : 'CRITICAL PRIORITY'];
  if (factors.reportCount > 0) reasons.push(`${factors.reportCount} reports`);
  if (factors.hasKeywords) reasons.push('suspicious keywords detected');
  if (factors.contentType === 'post') reasons.push('post (not comment)');
  return reasons.join(': ');
}

function generateReasoningWithContext(factors: PriorityFactors, score: number): string {
  const reasons: string[] = [score < 2 ? 'LOW PRIORITY' : score < 3 ? 'MEDIUM PRIORITY' : score < 4 ? 'HIGH PRIORITY' : 'CRITICAL PRIORITY'];
  if (factors.reportCount > 0) reasons.push(`${factors.reportCount} reports`);
  if (factors.accountAgeDays < 7) reasons.push('new account (<7 days)');
  else if (factors.accountAgeDays < 30) reasons.push(`young account (${factors.accountAgeDays} days)`);
  if (factors.userKarma < 10) reasons.push('very low karma');
  if (factors.previousViolations > 0) reasons.push(`${factors.previousViolations} previous violations`);
  if (factors.hasKeywords) reasons.push('suspicious keywords detected');
  return reasons.join(': ');
}

export function sortByPriority(items: Array<{ id: string; priority: PriorityScore }>): string[] {
  return items.sort((a, b) => b.priority.score - a.priority.score).map((item) => item.id);
}

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