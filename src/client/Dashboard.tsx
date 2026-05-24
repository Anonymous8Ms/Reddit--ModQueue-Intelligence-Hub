// ============================================================================
// MODQUEUE DASHBOARD - Main Dashboard Component
// ============================================================================

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { api } from './api';
import { ModQueueCard } from './ModQueueCard';
import { ContextPanel } from './ContextPanel';
import { PatternAlerts } from './PatternAlerts';
import { ActiveModerators } from './ActiveModerators';
import { PriorityIndicator } from './PriorityIndicator';
import { ModeratorGuide } from './ModeratorGuide';
import type {
  EnrichedModQueueItem,
  DetectedPattern,
  ItemClaim,
  ModPresence,
} from '../shared/types';

type DashboardFilter = 'all' | 'high' | 'mine';
type DashboardSort = 'priority' | 'reports' | 'time';

function isDashboardFilter(value: string): value is DashboardFilter {
  return value === 'all' || value === 'high' || value === 'mine';
}

function isDashboardSort(value: string): value is DashboardSort {
  return value === 'priority' || value === 'reports' || value === 'time';
}

export function ModQueueDashboard() {
  const [isCompactLayout, setIsCompactLayout] = useState(() => getIsCompactLayout());
  const [items, setItems] = useState<EnrichedModQueueItem[]>([]);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [moderators, setModerators] = useState<ModPresence[]>([]);
  const [currentModeratorUsername, setCurrentModeratorUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Context panel state
  const [contextUser, setContextUser] = useState<{ userId: string; username: string } | null>(null);

  // Filters
  const [filter, setFilter] = useState<DashboardFilter>('all');
  const [sortBy, setSortBy] = useState<DashboardSort>('priority');

  const loadQueue = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getQueue();
      if (data.type === 'queue') {
        setItems(data.items);
        setPatterns(data.patterns);
        setModerators(data.activeModerators);
        setCurrentModeratorUsername(data.currentModeratorUsername);
        setLastUpdated(Date.now());
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load modqueue';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setRefreshing(true);
      void loadQueue();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  useEffect(() => {
    const handleResize = () => {
      setIsCompactLayout(getIsCompactLayout());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadQueue();
  };

  const handleClaim = (itemId: string, claim: ItemClaim | null) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? (() => {
              const nextItem: EnrichedModQueueItem = { ...item };
              if (claim) {
                nextItem.claim = claim;
              } else {
                delete nextItem.claim;
              }
              return nextItem;
            })()
          : item
      )
    );
  };

  const handleContextRequest = (userId: string, username: string) => {
    setContextUser({ userId, username });
  };

  // Filter and sort items
  const filteredItems = items
    .filter((item) => {
      if (filter === 'high') return item.priority.score >= 3;
      if (filter === 'mine') {
        return !!currentModeratorUsername && item.claim?.claimedBy === currentModeratorUsername;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return b.priority.score - a.priority.score;
      if (sortBy === 'reports') return b.numReports - a.numReports;
      return b.createdUtc - a.createdUtc;
    });
  const displayedItems = filteredItems.slice(0, 10);
  const myClaimCount = currentModeratorUsername
    ? items.filter((i) => i.claim?.claimedBy === currentModeratorUsername).length
    : 0;
  const statCards = [
    {
      label: 'Critical',
      value: items.filter((i) => i.priority.score === 5).length,
      tone: '#ef4444',
      note: 'Immediate review',
    },
    {
      label: 'High',
      value: items.filter((i) => i.priority.score === 4).length,
      tone: '#f97316',
      note: 'Escalated risk',
    },
    {
      label: 'Claimed',
      value: items.filter((i) => i.claim).length,
      tone: '#3b82f6',
      note: 'Already in progress',
    },
    {
      label: 'My Claims',
      value: myClaimCount,
      tone: '#14b8a6',
      note: currentModeratorUsername ? `Assigned to u/${currentModeratorUsername}` : 'Not signed in',
    },
  ] as const;

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading ModQueue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <p>{error}</p>
        <button style={styles.retryBtn} onClick={handleRefresh}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.titleBlock}>
          <span style={styles.kicker}>Live Moderator Console</span>
          <h1 style={styles.title}>ModQueue Intelligence Hub</h1>
          <p style={styles.subtitle}>
            Surface urgent queue items first, keep moderators coordinated, and investigate faster
            without leaving the queue.
          </p>
        </div>
        <div style={styles.headerActions}>
          <div style={styles.headerMeta}>
            <span style={styles.statusPill}>Live queue</span>
            <span style={styles.count}>{items.length} items</span>
            {currentModeratorUsername && (
              <span style={styles.metaPill}>u/{currentModeratorUsername}</span>
            )}
            <span style={styles.metaPill}>
              {lastUpdated ? `Synced ${formatLastUpdated(lastUpdated)}` : 'Syncing'}
            </span>
          </div>
          <button
            style={{ ...styles.refreshBtn, ...(refreshing ? styles.refreshing : {}) }}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? '...' : '↻'}
          </button>
        </div>
      </header>

      {/* Patterns Alert */}
      <PatternAlerts patterns={patterns} />

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              ...styles.stat,
              borderColor: `${card.tone}33`,
              boxShadow: `inset 0 1px 0 ${card.tone}22`,
            }}
          >
            <span style={{ ...styles.statAccent, backgroundColor: `${card.tone}22`, color: card.tone }}>
              {card.label}
            </span>
            <span style={styles.statValue}>{card.value}</span>
            <span style={styles.statLabel}>{card.note}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filtersLabel}>Queue Lens</div>
        <select
          style={styles.select}
          value={filter}
          onChange={(e) => {
            if (isDashboardFilter(e.target.value)) {
              setFilter(e.target.value);
            }
          }}
        >
          <option value="all">All Items</option>
          <option value="high">High Priority</option>
          <option value="mine">My Claims</option>
        </select>
        <select
          style={styles.select}
          value={sortBy}
          onChange={(e) => {
            if (isDashboardSort(e.target.value)) {
              setSortBy(e.target.value);
            }
          }}
        >
          <option value="priority">Sort by Priority</option>
          <option value="reports">Sort by Reports</option>
          <option value="time">Sort by Time</option>
        </select>
      </div>

      {/* Main Content */}
      <div
        style={{
          ...styles.main,
          ...(isCompactLayout ? styles.mainCompact : {}),
        }}
      >
        {/* Queue List */}
        <div style={styles.queueList}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Top Priority Queue</h2>
              <p style={styles.sectionSubtitle}>
                Showing {displayedItems.length} of {filteredItems.length} filtered items
              </p>
            </div>
          </div>
          {displayedItems.length === 0 ? (
            <div style={styles.empty}>
              {items.length === 0 ? 'No items in modqueue' : 'No items match your filter'}
            </div>
          ) : (
            displayedItems.map((item) => (
              <ModQueueCard
                key={item.id}
                item={item}
                onClaim={handleClaim}
                onContextRequest={handleContextRequest}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <ActiveModerators moderators={moderators} />
          <ModeratorGuide
            itemCount={items.length}
            moderatorCount={moderators.length}
            lastUpdated={lastUpdated}
          />

          {/* Priority Legend */}
          <div style={styles.legend}>
            <h3 style={styles.legendTitle}>Priority Legend</h3>
            <div style={styles.legendItems}>
              <PriorityIndicator score={5} size="sm" />
              <span>Critical (5)</span>
            </div>
            <div style={styles.legendItems}>
              <PriorityIndicator score={4} size="sm" />
              <span>High (4)</span>
            </div>
            <div style={styles.legendItems}>
              <PriorityIndicator score={3} size="sm" />
              <span>Medium (3)</span>
            </div>
            <div style={styles.legendItems}>
              <PriorityIndicator score={2} size="sm" />
              <span>Low (2)</span>
            </div>
            <div style={styles.legendItems}>
              <PriorityIndicator score={1} size="sm" />
              <span>Minimal (1)</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Context Panel Modal */}
      {contextUser && (
        <ContextPanel
          userId={contextUser.userId}
          username={contextUser.username}
          onClose={() => setContextUser(null)}
        />
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  dashboard: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f9fafb',
    padding: '16px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '16px',
    color: '#9ca3af',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #374151',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '16px',
    color: '#ef4444',
  },
  retryBtn: {
    padding: '8px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px',
    padding: '20px 22px',
    borderRadius: '24px',
    border: '1px solid rgba(71, 85, 105, 0.4)',
    background:
      'radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 28%), linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.94))',
    boxShadow: '0 18px 40px rgba(2, 6, 23, 0.28)',
  },
  titleBlock: {
    maxWidth: '680px',
  },
  kicker: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 10px',
    marginBottom: '10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(20, 184, 166, 0.14)',
    color: '#5eead4',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '32px',
    lineHeight: 1.05,
    fontWeight: 800,
    letterSpacing: '-0.04em',
  },
  subtitle: {
    margin: 0,
    maxWidth: '620px',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#94a3b8',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'flex-end',
    flexDirection: 'column',
    gap: '12px',
  },
  headerMeta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    color: '#fca5a5',
    fontSize: '12px',
    fontWeight: 700,
  },
  count: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: 600,
  },
  metaPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#93c5fd',
    fontSize: '12px',
    fontWeight: 500,
  },
  refreshBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: '1px solid rgba(96, 165, 250, 0.25)',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    boxShadow: '0 10px 18px rgba(59, 130, 246, 0.28)',
  },
  refreshing: {
    opacity: 0.7,
  },
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
  },
  stat: {
    background:
      'linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96))',
    borderRadius: '18px',
    padding: '18px',
    border: '1px solid rgba(71, 85, 105, 0.35)',
  },
  statAccent: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    marginBottom: '12px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  statValue: {
    display: 'block',
    fontSize: '30px',
    fontWeight: 800,
    color: '#f9fafb',
    marginBottom: '4px',
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#94a3b8',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: '18px',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    border: '1px solid rgba(71, 85, 105, 0.28)',
  },
  filtersLabel: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#94a3b8',
  },
  select: {
    padding: '10px 12px',
    backgroundColor: 'rgba(30, 41, 59, 0.88)',
    border: '1px solid rgba(71, 85, 105, 0.7)',
    borderRadius: '10px',
    color: '#f9fafb',
    fontSize: '14px',
    cursor: 'pointer',
  },
  main: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: '16px',
  },
  mainCompact: {
    gridTemplateColumns: '1fr',
  },
  queueList: {
    minWidth: 0,
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionTitle: {
    margin: '0 0 4px 0',
    fontSize: '18px',
    fontWeight: 700,
    color: '#f8fafc',
  },
  sectionSubtitle: {
    margin: 0,
    fontSize: '12px',
    color: '#94a3b8',
  },
  empty: {
    textAlign: 'center',
    padding: '52px 24px',
    color: '#94a3b8',
    borderRadius: '18px',
    border: '1px dashed rgba(71, 85, 105, 0.5)',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  legend: {
    background:
      'linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96))',
    borderRadius: '18px',
    padding: '16px',
    border: '1px solid rgba(71, 85, 105, 0.32)',
  },
  legendTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
  },
  legendItems: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#cbd5e1',
  },
};

function getIsCompactLayout(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth < 1100;
}

function formatLastUpdated(timestamp: number): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 5) {
    return 'just now';
  }
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }
  return `${Math.floor(diffSeconds / 60)}m ago`;
}
