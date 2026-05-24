// ============================================================================
// MODQUEUE API ROUTES
// ============================================================================

import { Hono } from 'hono';
import { context } from '@devvit/web/server';
import { getEnrichedQueue, updateCurrentModPresence, getEnrichedUserContext } from '../services/queue';
import { claimQueueItem, releaseQueueItem, isItemClaimed } from '../services/collision';
import { getActiveModerators } from '../services/redis';
import { recordItemProcessed, getDailyStats } from '../services/analytics';
import type { QueueResponse, ClaimResponse, PresenceResponse, ContextResponse } from '../../shared/api';

export const queueApi = new Hono();

// ============================================================================
// GET /api/queue - Fetch enriched modqueue
// ============================================================================

queueApi.get('/queue', async (c) => {
  const subredditName = context.subredditName;

  if (!subredditName) {
    return c.json({ status: 'error', message: 'subredditName is required' }, 400);
  }

  try {
    // Update mod presence on each fetch
    const currentModerator = await updateCurrentModPresence(subredditName);

    const queueData = await getEnrichedQueue(subredditName);

    return c.json<QueueResponse>({
      type: 'queue',
      ...queueData,
      currentModeratorUsername: currentModerator?.username ?? null,
    });
  } catch (error) {
    console.error('Failed to fetch queue:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to fetch modqueue';
    return c.json(
      { status: 'error', message },
      500
    );
  }
});

// ============================================================================
// POST /api/claim - Claim an item for review
// ============================================================================

queueApi.post('/claim', async (c) => {
  const subredditName = context.subredditName;
  const { itemId } = await c.req.json<{ itemId: string }>();

  if (!subredditName) {
    return c.json({ status: 'error', message: 'subredditName is required' }, 400);
  }

  if (!itemId) {
    return c.json({ status: 'error', message: 'itemId is required' }, 400);
  }

  try {
    const result = await claimQueueItem(itemId, subredditName);

    if (result.success) {
      return c.json<ClaimResponse>({
        type: 'claim',
        success: true,
        claim: result.claim,
      });
    } else {
      return c.json<ClaimResponse>({
        type: 'claim',
        success: false,
        message: `Item is already claimed by ${result.existingClaim?.claimedBy}`,
        existingClaim: result.existingClaim,
      }, 409);
    }
  } catch (error) {
    console.error('Failed to claim item:', error);
    return c.json(
      { status: 'error', message: 'Failed to claim item' },
      500
    );
  }
});

// ============================================================================
// DELETE /api/claim - Release a claimed item
// ============================================================================

queueApi.delete('/claim', async (c) => {
  const { itemId } = await c.req.json<{ itemId: string }>();

  if (!itemId) {
    return c.json({ status: 'error', message: 'itemId is required' }, 400);
  }

  try {
    const released = await releaseQueueItem(itemId);

    return c.json({
      type: 'claim',
      success: released,
      message: released ? 'Item released' : 'Failed to release item (not your claim or does not exist)',
    });
  } catch (error) {
    console.error('Failed to release item:', error);
    return c.json(
      { status: 'error', message: 'Failed to release item' },
      500
    );
  }
});

// ============================================================================
// GET /api/claim/:itemId - Check claim status
// ============================================================================

queueApi.get('/claim/:itemId', async (c) => {
  const itemId = c.req.param('itemId');

  try {
    const claim = await isItemClaimed(itemId);

    return c.json({
      type: 'claim',
      claimed: !!claim,
      claim: claim || null,
    });
  } catch (error) {
    console.error('Failed to check claim:', error);
    return c.json(
      { status: 'error', message: 'Failed to check claim status' },
      500
    );
  }
});

// ============================================================================
// GET /api/presence - Get active moderators
// ============================================================================

queueApi.get('/presence', async (c) => {
  try {
    const moderators = await getActiveModerators();

    return c.json<PresenceResponse>({
      type: 'presence',
      moderators,
    });
  } catch (error) {
    console.error('Failed to get presence:', error);
    return c.json(
      { status: 'error', message: 'Failed to get active moderators' },
      500
    );
  }
});

// ============================================================================
// GET /api/context/:userId - Get user context
// ============================================================================

queueApi.get('/context/:userId', async (c) => {
  const userId = c.req.param('userId');
  const subredditName = context.subredditName;

  if (!subredditName) {
    return c.json({ status: 'error', message: 'subredditName is required' }, 400);
  }

  if (!userId) {
    return c.json({ status: 'error', message: 'userId is required' }, 400);
  }

  try {
    // Extract username from query or fetch from context
    const username = c.req.query('username') || 'unknown';
    
    const context = await getEnrichedUserContext(userId, username, subredditName);

    if (!context) {
      return c.json(
        { status: 'error', message: 'User not found' },
        404
      );
    }

    return c.json<ContextResponse>({
      type: 'context',
      userId,
      context,
    });
  } catch (error) {
    console.error('Failed to get user context:', error);
    return c.json(
      { status: 'error', message: 'Failed to get user context' },
      500
    );
  }
});

// ============================================================================
// POST /api/processed - Record item processed
// ============================================================================

queueApi.post('/processed', async (c) => {
  const subredditName = context.subredditName;

  if (!subredditName) {
    return c.json({ status: 'error', message: 'subredditName is required' }, 400);
  }

  const { priority } = await c.req.json<{ priority: number }>();

  try {
    await recordItemProcessed(subredditName);

    if (priority && priority >= 4) {
      // High priority item processed
    }

    return c.json({ status: 'success' });
  } catch (error) {
    console.error('Failed to record processed item:', error);
    return c.json(
      { status: 'error', message: 'Failed to record processed item' },
      500
    );
  }
});

// ============================================================================
// GET /api/stats - Get daily stats
// ============================================================================

queueApi.get('/stats', async (c) => {
  const subredditName = context.subredditName;

  if (!subredditName) {
    return c.json({ status: 'error', message: 'subredditName is required' }, 400);
  }

  try {
    const stats = await getDailyStats(subredditName);

    return c.json({
      type: 'stats',
      stats,
    });
  } catch (error) {
    console.error('Failed to get stats:', error);
    return c.json(
      { status: 'error', message: 'Failed to get stats' },
      500
);
  }
});
