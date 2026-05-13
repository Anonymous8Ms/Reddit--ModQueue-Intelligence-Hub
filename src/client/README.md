// ============================================================================
// MODQUEUE HUB - FRONTEND INTEGRATION GUIDE
// ============================================================================

## 📁 FRONTEND FILES

| File | Purpose |
|------|---------|
| `src/client/Dashboard.tsx` | Main dashboard component |
| `src/client/ModQueueCard.tsx` | Individual queue item card |
| `src/client/ContextPanel.tsx` | User context modal |
| `src/client/PatternAlerts.tsx` | Pattern detection alerts |
| `src/client/ActiveModerators.tsx` | Active moderator sidebar |
| `src/client/PriorityIndicator.tsx` | Priority badge component |
| `src/client/api.ts` | API client + helpers |

## 🚀 QUICK START

```tsx
import { ModQueueDashboard } from './client/Dashboard';

function App() {
  return <ModQueueDashboard />;
}
```

## 🔗 BACKEND CONNECTION

### API Endpoints (prefix: /modqueue)
- `GET /modqueue/queue` → QueueResponse
- `POST /modqueue/claim` → ClaimResponse  
- `DELETE /modqueue/claim` → ClaimResponse
- `GET /modqueue/presence` → PresenceResponse
- `GET /modqueue/context/:userId` → ContextResponse

### Types (from `src/shared/types.ts`)
```typescript
EnrichedModQueueItem  // Main item with priority & context
UserContext           // Enriched user data
ItemClaim            // Collision prevention
DetectedPattern       // Pattern alerts
ModPresence          // Active moderator
```

## ✅ TESTING

1. Run: `npm run dev`
2. Open Devvit playtest
3. Dashboard loads → shows queue items
4. Click "Claim" → updates Redis claim
5. Click "View Context" → opens user modal
6. Check patterns sidebar for alerts

## ⚠️ NOTES

- Uses inline styles (Tailwind not configured in client)
- Auto-refreshes every 30 seconds
- All API calls go through `src/client/api.ts`