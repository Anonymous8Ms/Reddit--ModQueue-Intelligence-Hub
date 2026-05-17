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
      if (filter === 'mine') return !!item.claim?.claimedBy;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return b.priority.score - a.priority.score;
      if (sortBy === 'reports') return b.numReports - a.numReports;
      return b.createdUtc - a.createdUtc;
    });
  const displayedItems = filteredItems.slice(0, 10);

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
        <h1 style={styles.title}>ModQueue Intelligence Hub</h1>
        <div style={styles.headerActions}>
          <span style={styles.count}>{items.length} items</span>
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
      <PatternAlerts patterns={patterns} onItemClick={(id) => console.log('Navigate to:', id)} />

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{items.filter((i) => i.priority.score === 5).length}</span>
          <span style={styles.statLabel}>Critical</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{items.filter((i) => i.priority.score === 4).length}</span>
          <span style={styles.statLabel}>High</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{items.filter((i) => i.claim).length}</span>
          <span style={styles.statLabel}>Claimed</span>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
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
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  count: {
    color: '#9ca3af',
    fontSize: '14px',
  },
  refreshBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
  },
  refreshing: {
    opacity: 0.7,
  },
  statsBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  stat: {
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    padding: '12px 20px',
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 700,
    color: '#f9fafb',
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#9ca3af',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  select: {
    padding: '8px 12px',
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '6px',
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
  queueList: {},
  sidebar: {},
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
  },
  legend: {
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    padding: '16px',
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
    color: '#9ca3af',
  },
};

function getIsCompactLayout(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth < 1100;
}
