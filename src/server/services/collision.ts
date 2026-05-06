// ============================================================================
// COLLISION PREVENTION SERVICE
// ============================================================================

import { getItemClaim, claimItem, releaseItemClaim, incrementStats } from './redis';
import { getCurrentModerator } from './reddit';
import type { ItemClaim } from '../../shared/types';

export type ClaimResult =
  | { success: true; claim: ItemClaim }
  | { success: false; reason: 'already_claimed' | 'not_found' | 'error'; existingClaim?: ItemClaim };

// ============================================================================
// CLAIM AN ITEM
// ============================================================================

export async function claimQueueItem(itemId: string, subreddit: string): Promise<ClaimResult> {
  const mod = await getCurrentModerator();
  if (!mod) {
    return { success: false, reason: 'error' };
  }

  const existingClaim = await getItemClaim(itemId);
  if (existingClaim && existingClaim.claimedBy !== mod.username) {
    return { success: false, reason: 'already_claimed', existingClaim };
  }

  const claim = await claimItem(itemId, mod.username);
  if (!claim) {
    return { success: false, reason: 'error' };
  }

  // Track stats
  if (!existingClaim) {
    await incrementStats(subreddit, 'collisionsAvoided');
  }

  return { success: true, claim };
}

// ============================================================================
// RELEASE AN ITEM
// ============================================================================

export async function releaseQueueItem(itemId: string): Promise<boolean> {
  const mod = await getCurrentModerator();
  if (!mod) return false;

  return await releaseItemClaim(itemId, mod.username);
}

// ============================================================================
// CHECK IF ITEM IS CLAIMED
// ============================================================================

export async function isItemClaimed(itemId: string): Promise<ItemClaim | null> {
  return await getItemClaim(itemId);
}

// ============================================================================
// GET MY CLAIMS
// ============================================================================

export async function getMyClaims(): Promise<ItemClaim[]> {
  const mod = await getCurrentModerator();
  if (!mod) return [];

  // This would need a scan for all claims by this mod
  // For now, we track claims per item
  return [];
}