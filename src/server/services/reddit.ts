// ============================================================================
// REDDIT API WRAPPER - All Reddit API operations
// ============================================================================

import { reddit } from '@devvit/web/server';
import type {
  ModQueueItem,
  UserContext,
  RecentActivity,
  ModAction,
} from '../../shared/types';

type RedditQueueItem = {
  id: string;
  authorId?: string;
  authorName: string;
  body?: string;
  permalink: string;
  createdAt: Date;
  subredditName: string;
  userReportReasons: string[];
  modReportReasons: string[];
} & (
  | {
      title?: string;
      numberOfReports: number;
    }
  | {
      numReports: number;
    }
);

type RedditModAction = {
  type: string;
  moderatorName: string;
  createdAt: Date;
  description?: string;
  details?: string;
  target?: {
    author?: string;
  };
};

// ============================================================================
// MODQUEUE OPERATIONS
// ============================================================================

export async function fetchModQueue(
  subredditName: string,
  limit: number = 100
): Promise<ModQueueItem[]> {
  try {
    const subreddit = await reddit.getSubredditByName(subredditName);
    const [modQueueResult, reportsResult] = await Promise.allSettled([
      subreddit.getModQueue({ type: 'all', limit }).all(),
      subreddit.getReports({ type: 'all', limit }).all(),
    ]);

    if (modQueueResult.status === 'rejected' && reportsResult.status === 'rejected') {
      throw modQueueResult.reason;
    }

    const combinedItems = new Map<string, RedditQueueItem>();

    if (modQueueResult.status === 'fulfilled') {
      for (const item of modQueueResult.value) {
        combinedItems.set(item.id, item);
      }
    } else {
      console.error('Failed to fetch modqueue listing:', modQueueResult.reason);
    }

    if (reportsResult.status === 'fulfilled') {
      for (const item of reportsResult.value) {
        combinedItems.set(item.id, item);
      }
    } else {
      console.error('Failed to fetch reports listing:', reportsResult.reason);
    }

    return Array.from(combinedItems.values()).map((item) => mapQueueItem(item, subredditName));
  } catch (error) {
    console.error('Failed to fetch modqueue:', error);
    const message =
      error instanceof Error ? error.message : 'Unknown modqueue fetch error';
    throw new Error(`Unable to fetch modqueue for r/${subredditName}: ${message}`);
  }
}

function mapQueueItem(item: RedditQueueItem, subredditName: string): ModQueueItem {
  const isPost = 'title' in item;

  return {
    id: item.id,
    kind: isPost ? 't3' : 't1',
    author: {
      id: item.authorId ?? 'unknown',
      name: item.authorName || '[deleted]',
    },
    title: isPost ? item.title || undefined : undefined,
    body: item.body || '',
    permalink: item.permalink || `/comments/${item.id}`,
    numReports: 'numberOfReports' in item
      ? item.numberOfReports || 0
      : item.numReports || 0,
    userReports: item.userReportReasons.map(createUserReportTuple),
    modReports: item.modReportReasons.map(createModReportTuple),
    createdUtc: Math.floor(item.createdAt.getTime() / 1000),
    subreddit: {
      name: item.subredditName || subredditName,
    },
  };
}

function createUserReportTuple(reason: string): [string, number] {
  return [reason, 1];
}

function createModReportTuple(reason: string): [string, string, number] {
  return [reason, 'moderator', 1];
}

// ============================================================================
// USER INFO OPERATIONS
// ============================================================================

export async function getUserInfo(
  userId: string,
  usernameHint?: string
): Promise<{
  username: string;
  karma: { post: number; comment: number; total: number };
  accountAgeDays: number;
  createdAt: number;
} | null> {
  try {
    const normalizedUserId = toRedditUserId(userId);
    let user =
      userId !== 'unknown'
        ? await reddit.getUserById(normalizedUserId)
        : undefined;

    if (!user && usernameHint && usernameHint !== '[deleted]' && usernameHint !== 'unknown') {
      user = await reddit.getUserByUsername(usernameHint);
    }

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

function toRedditUserId(userId: string): `t2_${string}` {
  return `t2_${userId.replace(/^t2_/, '')}`;
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
      const allComments = await comments.all();

      for (const comment of allComments.slice(0, 5)) {
        activities.push({
          type: 'comment',
          id: comment.id,
          subreddit: comment.subredditName || 'unknown',
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
      const allPosts = await posts.all();

      for (const post of allPosts.slice(0, 5)) {
        activities.push({
          type: 'post',
          id: post.id,
          subreddit: post.subredditName || 'unknown',
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
    const allEntries = await log.all();

    const actions: ModAction[] = [];

    for (const entry of allEntries) {
      if (entry.target?.author !== username) continue;

      const action = mapModAction(entry);
      if (!action) continue;

      actions.push(action);
    }

    return actions.slice(0, limit);
  } catch (error) {
    console.error(`Failed to get mod log for ${username}:`, error);
    return [];
  }
}

function mapModAction(entry: RedditModAction): ModAction | null {
  switch (entry.type) {
    case 'banuser':
      return buildModAction('ban', entry);
    case 'approvecomment':
    case 'approvelink':
      return buildModAction('approve', entry);
    case 'removecomment':
    case 'removelink':
    case 'spamcomment':
    case 'spamlink':
      return buildModAction('remove', entry);
    case 'muteuser':
      return buildModAction('mute', entry);
    case 'addnote':
      return buildModAction('warn', entry);
    default:
      return null;
  }
}

function buildModAction(
  action: ModAction['action'],
  entry: RedditModAction
): ModAction {
  return {
    action,
    modUsername: entry.moderatorName || 'unknown',
    timestamp: entry.createdAt.getTime(),
    details: entry.details || entry.description || '',
  };
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
      getUserInfo(userId, username),
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
