// ============================================================================
// REDDIT API WRAPPER - All Reddit API operations
// ============================================================================

import { reddit, context } from '@devvit/web/server';
import type {
  ModQueueItem,
  UserContext,
  RecentActivity,
  ModAction,
} from '../../shared/types';

// ============================================================================
// MODQUEUE OPERATIONS
// ============================================================================

export async function fetchModQueue(
  subredditName: string,
  limit: number = 100
): Promise<ModQueueItem[]> {
  try {
    const items = await reddit.getModQueue({
      subreddit: subredditName,
      limit,
    });

    return items.all().map((item: any) => ({
      id: item.id,
      kind: item.kind,
      author: {
        id: item.author?.id || 'unknown',
        name: item.author?.name || '[deleted]',
      },
      title: item.title || undefined,
      body: item.selftext || item.body || '',
      permalink: item.permalink || `/comments/${item.id}`,
      numReports: item.numReports || 0,
      userReports: (item.userReports || []) as [string, number][],
      modReports: (item.modReports || []) as [string, string, number][],
      createdUtc: item.createdUtc || Date.now() / 1000,
      subreddit: {
        name: item.subreddit?.name || subredditName,
      },
    }));
  } catch (error) {
    console.error('Failed to fetch modqueue:', error);
    return [];
  }
}

// ============================================================================
// USER INFO OPERATIONS
// ============================================================================

export async function getUserInfo(userId: string): Promise<{
  username: string;
  karma: { post: number; comment: number; total: number };
  accountAgeDays: number;
  createdAt: number;
} | null> {
  try {
    const user = await reddit.getUserById(userId);

    if (!user) return null;

    const accountAgeMs = Date.now() - user.createdAt.getTime();
    const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

    return {
      username: user.username,
      karma: {
        post: user.linkKarma || 0,
        comment: user.commentKarma || 0,
        total: (user.linkKarma || 0) + (user.commentKarma || 0),
      },
      accountAgeDays,
      createdAt: user.createdAt.getTime(),
    };
  } catch (error) {
    console.error(`Failed to get user info for ${userId}:`, error);
    return null;
  }
}

export async function getCurrentModerator(): Promise<{
  id: string;
  username: string;
} | null> {
  try {
    const mod = await reddit.getCurrentUser();
    if (!mod) return null;
    return {
      id: mod.id,
      username: mod.username,
    };
  } catch (error) {
    console.error('Failed to get current moderator:', error);
    return null;
  }
}

// ============================================================================
// USER ACTIVITY OPERATIONS
// ============================================================================

export async function getUserRecentActivity(
  username: string,
  limit: number = 10
): Promise<RecentActivity[]> {
  try {
    const activities: RecentActivity[] = [];

    // Get recent comments
    try {
      const comments = await reddit.getCommentsByUser({
        username,
        limit,
        sort: 'new',
      });

      for (const comment of comments.all().slice(0, 5)) {
        activities.push({
          type: 'comment',
          id: comment.id,
          subreddit: comment.subreddit?.name || 'unknown',
          content: comment.body?.substring(0, 200) || '',
          score: comment.score || 0,
          createdAt: comment.createdAt.getTime(),
        });
      }
    } catch (e) {
      // User might have no comments
    }

    // Get recent posts
    try {
      const posts = await reddit.getPostsByUser({
        username,
        limit,
        sort: 'new',
      });

      for (const post of posts.all().slice(0, 5)) {
        activities.push({
          type: 'post',
          id: post.id,
          subreddit: post.subreddit?.name || 'unknown',
          content: post.title?.substring(0, 200) || '',
          score: post.score || 0,
          createdAt: post.createdAt.getTime(),
        });
      }
    } catch (e) {
      // User might have no posts
    }

    // Sort by recency and return top items
    return activities
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  } catch (error) {
    console.error(`Failed to get activity for ${username}:`, error);
    return [];
  }
}

// ============================================================================
// MOD LOG OPERATIONS
// ============================================================================

export async function getUserModActions(
  username: string,
  subredditName: string,
  limit: number = 100
): Promise<ModAction[]> {
  try {
    const log = await reddit.getModerationLog({
      subredditName,
      limit,
    });

    const actions: ModAction[] = [];

    for (const entry of log.all()) {
      if (entry.target?.author === username) {
        actions.push({
          action: entry.action || 'unknown',
          modUsername: entry.moderator?.username || 'unknown',
          timestamp: entry.date?.getTime() || Date.now(),
          details: entry.details || '',
        });
      }
    }

    return actions.slice(0, limit);
  } catch (error) {
    console.error(`Failed to get mod log for ${username}:`, error);
    return [];
  }
}

// ============================================================================
// FULL USER CONTEXT (for Context Enrichment)
// ============================================================================

export async function getFullUserContext(
  userId: string,
  username: string,
  subredditName: string
): Promise<UserContext | null> {
  try {
    // Fetch user info and recent activity in parallel
    const [userInfo, recentActivity, modActions] = await Promise.all([
      getUserInfo(userId),
      getUserRecentActivity(username, 10),
      getUserModActions(username, subredditName, 50),
    ]);

    if (!userInfo) return null;

    // Count posts/comments in subreddit
    const subredditPostCount = recentActivity.filter(
      (a) => a.subreddit === subredditName && a.type === 'post'
    ).length;
    const subredditCommentCount = recentActivity.filter(
      (a) => a.subreddit === subredditName && a.type === 'comment'
    ).length;

    return {
      userId,
      username: userInfo.username,
      karma: userInfo.karma,
      accountAgeDays: userInfo.accountAgeDays,
      createdAt: userInfo.createdAt,
      recentActivity: recentActivity.slice(0, 5),
      modActions: modActions.slice(0, 10),
      subredditParticipation: {
        postCount: subredditPostCount,
        commentCount: subredditCommentCount,
        firstSeen: recentActivity.length > 0
          ? Math.min(...recentActivity.map((a) => a.createdAt))
          : Date.now(),
      },
    };
  } catch (error) {
    console.error(`Failed to get full context for ${username}:`, error);
    return null;
  }
}