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
    backgroundColor: '#f6f1ea',
    color: '#18212b',
    padding: '20px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '16px',
    color: '#8a8f98',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e6ddd0',
    borderTopColor: '#d9482b',
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
    color: '#d9482b',
  },
  retryBtn: {
    padding: '10px 18px',
    backgroundColor: '#d9482b',
    color: 'white',
    border: 'none',
    borderRadius: '999px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px',
    padding: '26px 28px',
    borderRadius: '28px',
    border: '1px solid #e5dbcf',
    backgroundColor: '#fffdf8',
    boxShadow: '0 18px 40px rgba(24, 33, 43, 0.08)',
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
    backgroundColor: '#fff3ef',
    color: '#d9482b',
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
    color: '#66707b',
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
    backgroundColor: '#fff3ef',
    color: '#d9482b',
    fontSize: '12px',
    fontWeight: 700,
  },
  count: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: '#f3eee6',
    color: '#4f5863',
    fontSize: '12px',
    fontWeight: 600,
  },
  metaPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: '#f3eee6',
    color: '#66707b',
    fontSize: '12px',
    fontWeight: 500,
  },
  refreshBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: '1px solid #f0c8bc',
    backgroundColor: '#d9482b',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(217, 72, 43, 0.18)',
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
      'linear-gradient(180deg, rgba(255, 253, 248, 1), rgba(251, 247, 241, 1))',
    borderRadius: '20px',
    padding: '18px',
    border: '1px solid #e8ddd1',
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
    color: '#18212b',
    marginBottom: '4px',
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: '18px',
    backgroundColor: '#fffdf8',
    border: '1px solid #e8ddd1',
  },
  filtersLabel: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#8a8f98',
  },
  select: {
    padding: '10px 12px',
    backgroundColor: '#fbf7f1',
    border: '1px solid #e6ddd0',
    borderRadius: '12px',
    color: '#18212b',
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
    color: '#18212b',
  },
  sectionSubtitle: {
    margin: 0,
    fontSize: '12px',
    color: '#8a8f98',
  },
  empty: {
    textAlign: 'center',
    padding: '52px 24px',
    color: '#8a8f98',
    borderRadius: '18px',
    border: '1px dashed #ddcfbf',
    backgroundColor: '#fffdf8',
  },
  legend: {
    backgroundColor: '#fffdf8',
    borderRadius: '20px',
    padding: '16px',
    border: '1px solid #e7ddd0',
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
    color: '#4f5863',
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
