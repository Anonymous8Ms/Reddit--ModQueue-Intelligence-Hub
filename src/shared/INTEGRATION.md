# ModQueue Intelligence Hub - Frontend Integration Guide

## 📁 Project Structure

```
src/
├── server/                    # Backend (Devvit server)
│   ├── index.ts              # Server entry point
│   ├── routes/               # API routes
│   │   ├── queue.ts         # ModQueue API routes
│   │   └── ...
│   └── services/            # Business logic
│       ├── redis.ts        # Redis operations
│       ├── reddit.ts       # Reddit API wrapper
│       ├── scoring.ts      # Priority scoring
│       ├── patterns.ts     # Pattern detection
│       ├── queue.ts        # Queue orchestration
│       ├── collision.ts    # Collision prevention
│       └── analytics.ts    # Analytics
└── shared/                   # Shared types & API
    ├── types.ts             # TypeScript types
    ├── api.ts               # API response types
    └── FRONTEND_GUIDE.md    # This file
```

## 🔌 API Endpoints

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `GET` | `/modqueue/queue` | - | `QueueResponse` |
| `POST` | `/modqueue/claim` | `{itemId: string}` | `ClaimResponse` |
| `DELETE` | `/modqueue/claim` | `{itemId: string}` | `ClaimResponse` |
| `GET` | `/modqueue/claim/:itemId` | - | `{claimed, claim}` |
| `GET` | `/modqueue/presence` | - | `PresenceResponse` |
| `GET` | `/modqueue/context/:userId?username=xxx` | - | `ContextResponse` |
| `POST` | `/modqueue/processed` | `{priority?: number}` | `{status}` |
| `GET` | `/modqueue/stats` | - | `{type, stats}` |

## 📦 Key Types

```typescript
// Main enriched item type
interface EnrichedModQueueItem {
  id: string;
  kind: 't3' | 't1';        // post or comment
  author: { id: string; name: string };
  title?: string;
  body: string;
  permalink: string;
  numReports: number;
  priority: {
    score: number;           // 0-5 (higher = urgent)
    reasoning: string;
    factors: {
      reportCount: number;
      userKarma: number;
      accountAgeDays: number;
      hasKeywords: boolean;
      previousViolations: number;
    };
  };
  context?: UserContext;     // Enriched user data
  claim?: ItemClaim;         // If claimed by someone
}

// User context for enrichment panel
interface UserContext {
  userId: string;
  username: string;
  karma: { post: number; comment: number; total: number };
  accountAgeDays: number;
  recentActivity: RecentActivity[];
  modActions: ModAction[];
}

// Collision prevention
interface ItemClaim {
  itemId: string;
  claimedBy: string;
  claimedAt: number;
  expiresAt: number;
}

// Pattern detection
interface DetectedPattern {
  type: 'spam_wave' | 'brigade' | 'bot_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedItems: string[];
  confidence: number;
}
```

## 🚀 Quick Start

```typescript
import type { QueueResponse } from '../shared/api';

// Fetch queue
const res = await fetch('/modqueue/queue');
const data: QueueResponse = await res.json();

// Sort by priority
const sortedItems = data.items.sort((a, b) => 
  b.priority.score - a.priority.score
);

// Check if item is claimed
if (item.claim) {
  console.log(`Claimed by ${item.claim.claimedBy}`);
}
```

## 🎨 Priority Colors

| Score | Level | Color |
|-------|-------|-------|
| 4-5 | Critical | `#dc2626` |
| 3-4 | High | `#f97316` |
| 2-3 | Medium | `#eab308` |
| 0-2 | Low | `#22c55e` |

## 📡 Mod Presence

Active moderators update every 60 seconds via Redis TTL.

```typescript
// Show who is online
data.activeModerators.forEach(mod => {
  console.log(`${mod.username} in ${mod.currentSubreddit}`);
});
```

## ⚠️ Important Notes

1. All endpoints require Devvit context (runs within Reddit)
2. User context is cached for 10 minutes
3. Priority scores are cached for 2 minutes
4. Claims expire after 5 minutes (auto-release)